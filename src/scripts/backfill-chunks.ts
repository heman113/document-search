import { pool } from "../db";
import { chunkDocument } from "../chunking";
import { generateEmbeddings } from "../embeddings";

interface ExistingDocument {
    id: string;
    title: string;
    external_id: string;
    content: string;
}

function vectorToSql(vector: number[]): string {
    if (!vector.length || !vector.every(Number.isFinite)) {
        throw new Error("Invalid vector");
    }
    return `[${vector.join(",")}]`;
}

async function backfillDocument(document: ExistingDocument): Promise<boolean> {
    //chunk the existing document
    const chunks = chunkDocument(document.content);

    if (chunks.length === 0) {
        throw new Error(`Document ${document.id} produced no chunks.`);
    }

    //generate chunk embeddings
    const embeddings = await generateEmbeddings(
        chunks.map((chunk) => chunk.content)
    );
    
    if (embeddings.length !== chunks.length) {
        throw new Error("Chunk and embedding count does not match");
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");
        
        const parent = await client.query(
            `SELECT id FROM documents WHERE id = $1 FOR UPDATE`,
            [document.id],
        );
        if (parent.rowCount === 0) {
            await client.query("ROLLBACK");
            return false;
        }

        const existingChunks = await client.query(
            `SELECT 1 FROM document_chunks WHERE document_id = $1 LIMIT 1`,
            [document.id],
        );

        if (existingChunks.rowCount && existingChunks.rowCount > 0) {
            await client.query("COMMIT");
            return false;
        }

        const params: unknown[] = [document.id];

        const values = chunks.map((chunk, index) => {
            params.push(
                chunk.chunkIndex,
                chunk.content,
                chunk.startToken,
                chunk.endToken,
                vectorToSql(embeddings[index])
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

        await client.query("COMMIT");
        return true;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function main() {
    try {
        const result = await pool.query<ExistingDocument>(
            `
                SELECT
                    d.id,
                    d.title,
                    d.external_id,
                    d.content
                FROM documents d
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM document_chunks c
                    WHERE c.document_id = d.id
                )
                ORDER BY d.created_at ASC
            `,
        );

        const documents = result.rows;

        console.log(`Found ${documents.length} documents to backfill`);

        let processed = 0;
        let skipped = 0;

        for (const document of documents) {
            console.log(`Processing: ${document.title} (${document.external_id})`);

            const inserted = await backfillDocument(document);

            if (inserted) {
                processed++;
                console.log(`Backfilled ${document.external_id}`);
            } else {
                skipped++;
                console.log(`Skipped ${document.external_id}`);
            }
        }

        console.log("\nBackfill completed");
        console.log(`Processed: ${processed}`);
        console.log(`Skipped: ${skipped}`);
    } finally {
        await pool.end();
    }
}

main().catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
});