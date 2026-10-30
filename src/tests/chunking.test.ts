import { describe, it, expect } from "vitest";
import { chunkDocument } from "../chunking";

describe("chunkDocument", () => {
    it("returns an empty array for empty input", () => {
        expect(chunkDocument("")).toEqual([]);
        expect(chunkDocument("   ")).toEqual([]);
    });

    it("returns one chunk for short documents", () => {
        const text = "This is a short document";

        const chunks = chunkDocument(text);

        expect(chunks).toHaveLength(1);
        expect(chunks[0].content).toBe(text);
    });

    it("splits long documents into chunks", () => {
        const text = "hello ".repeat(500);

        const chunks = chunkDocument(text,{
            chunkSize: 100,
            chunkOverlap: 20
        });

        expect(chunks.length).toBeGreaterThan(1);
        for(const chunk of chunks){
            expect(chunk.tokenCount).toBeLessThanOrEqual(100);
        }
    });

    it("maintains the configured token overlap", () => {
    const text = "hello ".repeat(500);

    const chunks = chunkDocument(text, {
      chunkSize: 100,
      chunkOverlap: 20,
    });

    expect(chunks[1].startToken).toBe(80);
    expect(chunks[0].endToken - chunks[1].startToken).toBe(20);
  });

  it("assigns sequential chunk indexes", () => {
    const text = "hello ".repeat(500);

    const chunks = chunkDocument(text, {
      chunkSize: 100,
      chunkOverlap: 20,
    });

    expect(chunks.map((chunk) => chunk.chunkIndex)).toEqual(
      chunks.map((_, index) => index),
    );
  });

  it("rejects invalid chunk configurations", () => {
    expect(() =>
      chunkDocument("Some content", {
        chunkSize: 0,
      }),
    ).toThrow();

    expect(() =>
      chunkDocument("Some content", {
        chunkSize: 100,
        chunkOverlap: 100,
      }),
    ).toThrow();
  });
})