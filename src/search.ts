import { pool } from "./db";
import { generateEmbedding } from "./embeddings";
import type { SearchInput } from "./schema";

export type SearchMode = "exact" | "ann";

function vectorToSql(vector: number[]): string {
    if(!vector.length || !vector.every(Number.isFinite)){
        throw new Error("Invalid vector");
    }

    return `[${vector.join(",")}]`;
}

export async function searchDocuments(
    input: SearchInput,
    mode: SearchMode
) {
    const embedding = await generateEmbedding(input.query);
    const client = await pool.connect();

    try{
        await client.query("BEGIN");

        if(mode == "exact") {
            await client.query("SET LOCAL enable_indexscan = off");
        }else{
            await client.query("SET LOCAL enable_seqscan = off");
        }

        const params: unknown[] = [
            vectorToSql(embedding),
            input.tenantId,
        ];

        const filters: string[] = [
            "tenant_id = $2"
        ]

        if(input.category) {
            params.push(input.category);
            filters.push(`category = $${params.length}`);
        }

        if(input.tags?.length) {
            params.push(input.tags),
            filters.push(`tags && $${params.length}::text[]`);
        }

        params.push(input.limit);
        const limitPlaceholder = `$${params.length}`;

        const sql = `
            SELECT
                id,
                external_id,
                title,
                content,
                category,
                tags,
                1 - (embedding <=> $1::vector) AS similarity,
                embedding <=> $1::vector AS distance
            FROM documents
            WHERE ${filters.join(" AND ")}
            ORDER BY embedding <=> $1::vector
            LIMIT ${limitPlaceholder}
        `;

        const result = await client.query(sql,params);
        await client.query("COMMIT");

        return result.rows.map((row) => ({
            ...row,
            similarity: Number(row.similarity),
            distance: Number(row.distance),
        }));
    } catch(error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}