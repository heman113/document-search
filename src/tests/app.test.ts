
import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("../db", () => ({
  pool: {
    query: vi.fn(),
  },
}));

vi.mock("../ingestion", () => ({
  ingestDocument: vi.fn(),
}));

vi.mock("../search", () => ({
  searchDocuments: vi.fn(),
}));

import app from "../app";
import { pool } from "../db";
import { ingestDocument } from "../ingestion";
import { searchDocuments } from "../search";
import { Result } from "pg";

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /health", () => {
  it("returns 200 when the database is connected", async () => {
    vi.mocked(pool.query).mockResolvedValue({
      rows: [],
    } as never);

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      database: "connected",
    });
    expect(pool.query).toHaveBeenCalledWith("SELECT 1");
  });

  it("returns 503 when the database is unavailable", async () => {
    vi.mocked(pool.query).mockRejectedValue(
      new Error("Database connection failed"),
    );

    const response = await request(app).get("/health");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      status: "error",
      database: "unavailable",
    });
  });
});

describe("POST /documents", () => {
  it("returns 400 when the request body is invalid", async () => {
    const response = await request(app)
      .post("/documents")
      .send({
        tenantId: "tenant-1",
        title: "Test document",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid document");
    expect(ingestDocument).not.toHaveBeenCalled();
  });

  it("ingests a valid document", async () => {
    vi.mocked(ingestDocument).mockResolvedValue({
      id: "doc-1",
    } as never);

    const document = {
      tenantId: "tenant-1",
      externalId: "external-1",
      title: "Test document",
      content: "This is test content.",
      category: "engineering",
    };

    const response = await request(app)
      .post("/documents")
      .send(document);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Document ingested");
    expect(ingestDocument).toHaveBeenCalledWith({
      ...document,
      tags: [],
    });
  });
});

describe("Search request validation", () => {
  it.each(["/search", "/search/exact", "/search/ann"])(
    "returns 400 for an invalid request at %s",
    async (endpoint) => {
      const response = await request(app)
        .post(endpoint)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid search request");
      expect(searchDocuments).not.toHaveBeenCalled();
    },
  );
});

describe("Successful search requests", () => {
  const searchPayload = {
    tenantId: "tenant-1",
    query: "How does vector search work",
  };

  const mockResults = [
    {
      id: "doc-1",
      external_id: "external-1",
      title: "Vector search",
      content: "Vector search use embeddings",
      category: "engineering",
      tags: ["AI", "search"],
      similarity: 0.95,
      distance: 0.05
    }
  ];

  it.each(["/search", "/search/exact"])(
    "returns exact search result from %s",
    async (endpoint) => {
      vi.mocked(searchDocuments).mockResolvedValue(
        mockResults as never,
      );
      const response = await request(app)
      .post(endpoint)
      .send(searchPayload);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        mode: "exact",
        count: 1,
        results: mockResults
      });

      expect(searchDocuments).toHaveBeenCalledWith(
        {
          ...searchPayload,
          limit: 5,
        },
        "exact",
      );
    }
  );

  it("returns ANN search results", async () => {
    vi.mocked(searchDocuments).mockResolvedValue(
      mockResults as never,
    );

    const response = await request(app)
      .post("/search/ann")
      .send(searchPayload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      mode: "hnsw",
      count: 1,
      results: mockResults,
    });

    expect(searchDocuments).toHaveBeenCalledWith(
      {
        ...searchPayload,
        limit: 5,
      },
      "ann",
    );
  });
});

describe("Search error handling", () => {
  it("returns 500 when search fails", async () => {
    vi.mocked(searchDocuments).mockRejectedValue(
      new Error("Database query failed"),
    );

    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const response = await request(app)
      .post("/search")
      .send({
        tenantId: "tenant-1",
        query: "test query",
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: "Internal server error",
    });

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
})
