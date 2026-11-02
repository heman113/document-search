import { pool } from "./db.js";
import { generateEmbedding, generateEmbeddings } from "./embeddings.js";
import type { DocumentInput } from "./schema.js";
import { chunkDocument } from "./chunking.js";

function vectorToSql(vector: number[]): string {
    if (!vector.length || !vector.every(Number.isFinite)) {
        throw new Error("Invalid vector");
    }
    return `[${vector.join(",")}]`;
}

export async function ingestDocument(input: DocumentInput) {
    //embed parent document
    const textToEmbed = `${input.title}\n\n${input.content}`;
    const documentEmbedding = await generateEmbedding(textToEmbed);

    //Split parent into chunks
    const chunks = chunkDocument(input.content);

    //Generate embeddings for chunks in batch
    const chunkEmbeddings = await generateEmbeddings(chunks.map((chunk) => chunk.content));
    if (chunkEmbeddings.length !== chunks.length) {
        throw new Error("Chunks and embeddings count do not match.");
    }

    //Start the transaction only after API calls finish
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

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
                vectorToSql(documentEmbedding),
            ]
        );

        const document = result.rows[0];
        const documentId = document.id;

        //Delete old chunks when re-ingesting an existing document
        await client.query(
            `DELETE FROM document_chunks WHERE document_id = $1`,
            [documentId],
        )

        //Insert all chunks in one SQL
        if (chunks.length > 0) {
            const params: unknown[] = [documentId];
            const values = chunks.map((chunk, index) => {
                const embedding = chunkEmbeddings[index];
                params.push(
                    chunk.chunkIndex,
                    chunk.content,
                    chunk.startToken,
                    chunk.endToken,
                    vectorToSql(embedding),
                );

                const start = params.length - 4;

                return `(
                    $1,
                    $${start},
                    $${start + 1},
                    $${start + 2},
                    $${start + 3},
                    $${start + 4}::vector
                )`;
            });

            await client.query(
                `
                    INSERT INTO document_chunks (
                        document_id,
                        chunk_index,
                        content,
                        start_token,
                        end_token,
                        embedding
                    )
                    VALUES ${values.join(",")}
                `,
                params,
            );
        }

        //commit parent and chunks together
        await client.query("COMMIT");
        return document;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}