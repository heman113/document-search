import { pool } from "./db.js";
import { generateEmbedding } from "./embeddings.js";
import type { DocumentInput } from "./schema.js";

function vectorToSql(vector: number[]) : string {
    if(!vector.length || !vector.every(Number.isFinite)){
        throw new Error("Invalid vector");
    }
    return `[${vector.join(",")}]`;
}

export async function ingestDocument(input: DocumentInput) {

    const textToEmbed = `${input.title}\n\n${input.content}`;
    const embedding = await generateEmbedding(textToEmbed);

    const result = await pool.query(
        `
            INSERT INTO documents (
                tenant_id,
                external_id,
                title,
                content,
                category,
                tags,
                embedding
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7::vector)
            ON CONFLICT (tenant_id, external_id)
            DO UPDATE SET
                title = EXCLUDED.title,
                content = EXCLUDED.content,
                category = EXCLUDED.CATEGORY,
                tags = EXCLUDED.tags,
                embedding = EXCLUDED.embedding,
                updated_at = NOW()
            RETURNING
                id,
                tenant_id,
                external_id,
                title,
                content,
                category,
                tags,
                created_at,
                updated_at
        `,
        [
            input.tenantId,
            input.externalId,
            input.title,
            input.content,
            input.category,
            input.tags,
            vectorToSql(embedding),
        ]
    );

    return result.rows[0];
}