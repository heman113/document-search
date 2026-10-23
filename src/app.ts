import "dotenv/config";
import express from "express";
import { pool } from "./db";
import { documentSchema, searchSchema } from "./schema";
import { ingestDocument } from "./ingestion";
import { searchDocuments } from "./search";

const app = express();

app.use(express.json({limit: "100kb"}));

app.get("/health", async(_req, res) => {
    try{
        await pool.query("SELECT 1");
        res.json({ status: "ok", database: "connected" });
    } catch {
        res.status(503).json({
            status: "error",
            database: "unavailable",
        });
    }
})

app.post("/documents", async (req, res, next) => {
    try{
        const parsed = documentSchema.safeParse(req.body);

        if(!parsed.success) {
            return res.status(400).json({
                error: "Invalid document",
                details: parsed.error.issues,
            });
        }

        const document = await ingestDocument(parsed.data);

        return res.status(200).json({
            message: "Document ingested",
            document,
        });
    } catch (error) {
        next(error);
    }
});

app.post("/search", async (req, res, next) => {
    try{
        const parsed = searchSchema.safeParse(req.body);

        if(!parsed.success){
            return res.status(400).json({
                error: "Invalid search request",
                details: parsed.error.issues,
            });
        }

        const results = await searchDocuments(parsed.data, "exact");
        return res.json({
            mode: "exact",
            count: results.length,
            results,
        });
    }catch (error){
        next(error);
    }
});

app.post("/search/exact", async (req, res, next) => {
    try{
        const parsed = searchSchema.safeParse(req.body);

        if(!parsed.success){
            return res.status(400).json({
                error: "Invalid search request",
                details: parsed.error.issues,
            });
        }

        const results = await searchDocuments(parsed.data, "exact");
        return res.json({
            mode: "exact",
            count: results.length,
            results,
        });
    }catch (error){
        next(error);
    }
});

app.post("/search/ann", async (req, res, next) => {
    try{
        const parsed = searchSchema.safeParse(req.body);

        if(!parsed.success){
            return res.status(400).json({
                error: "Invalid search request",
                details: parsed.error.issues,
            });
        }

        const results = await searchDocuments(parsed.data, "ann");
        return res.json({
            mode: "hnsw",
            count: results.length,
            results,
        });
    }catch (error){
        next(error);
    }
});

//development/admin endpoint
app.post("/admin/indexes/hnsw", async(req, res, next) => {
    const expected_key = process.env.ADMIN_API_KEY;
    const supplied_key = req.header("x-admin-key");

    if(!expected_key || supplied_key !== expected_key) {
        return res.status(401).json({
            error: "Unauthorized"
        });
    }

    try {
        await pool.query(`
            CREATE INDEX CONCURRENTLY IF NOT EXISTS
                documents_embedding_hnsw_idx
            ON documents
            USING hnsw (embedding vector_cosine_ops)    
        `);

        return res.json({ message: "HNSW index is ready" });
    } catch (error) {
        next(error);
    }
});

app.use(
    (
        error: unknown,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction
    ) => {
        console.error("Request failed", error);
        res.status(500).json({
            error: "Internal server error",
        });
    }
);

export default app;