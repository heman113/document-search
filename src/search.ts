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

        if(mode === "exact") {
            await client.query("SET LOCAL enable_indexscan = off");
        }else{
            await client.query("SET LOCAL enable_seqscan = off");
        }

        const params: unknown[] = [
            vectorToSql(embedding),
            input.tenantId,
        ];

        const filters: string[] = [
            "d.tenant_id = $2"
        ]

        if(input.category) {
            params.push(input.category);
            filters.push(`d.category = $${params.length}`);
        }

        if(input.tags?.length) {
            params.push(input.tags),
            filters.push(`d.tags && $${params.length}::text[]`);
        }

        params.push(input.limit);
        const limitPlaceholder = `$${params.length}`;

        const sql = `
            SELECT
                c.id,
                c.document_id,
                c.chunk_index,
                c.content,
                d.external_id,
                d.title,
                d.category,
                d.tags,
                1 - (c.embedding <=> $1::vector) AS similarity,
                c.embedding <=> $1::vector AS distance
            FROM document_chunks c
            INNER JOIN documents d
                ON d.id = c.document_id
            WHERE ${filters.join(" AND ")}
            ORDER BY c.embedding <=> $1::vector
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