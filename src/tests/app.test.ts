
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
