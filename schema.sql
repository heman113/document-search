CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id TEXT NOT NULL,
    external_id TEXT NOT NULL,

    title TEXT NOT NULL,
    content TEXT NOT NULL,

    category TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT'{}',

    embedding VECTOR(1536) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (tenant_id, external_id)
);

CREATE INDEX IF NOT EXISTS documents_tenant_category_idx
ON documents (tenant_id, category);

CREATE INDEX IF NOT EXISTS documents_tags_idx
ON documents USING GIN (tags);