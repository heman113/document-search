export async function up(pgm) {
    pgm.sql(`
        CREATE TABLE document_chunks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            document_id UUID NOT NULL
                REFERENCES documents(id)
                ON DELETE CASCADE,
            chunk_index INTEGER NOT NULL
                CHECK (chunk_index >= 0),
            content TEXT NOT NULL
                CHECK (length(trim(content)) > 0),
            start_token INTEGER NOT NULL
                CHECK (start_token >= 0),
            end_token INTEGER NOT NULL
                CHECK (end_token > start_token),
            embedding VECTOR(1536) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT document_chunks_document_index_unique
                UNIQUE (document_id, chunk_index)
        );

        CREATE INDEX document_chunks_embedding_hnsw_idx
            ON document_chunks
            USING hnsw (embedding vector_cosine_ops);
        
        CREATE INDEX document_chunks_document_id_idx
            ON document_chunks (document_id)
        `);
}

export async function down(pgm) {
    pgm.sql(`
        DROP TABLE IF EXISTS document_chunks;
        `)
}