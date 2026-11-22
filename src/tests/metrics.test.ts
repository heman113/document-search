
import { describe, expect, it } from "vitest";

import {
    precisionAtK,
    recallAtK,
    reciprocalRankAtK,
    ndcgAtK,
} from "../evaluation/metrics.js";

describe("retrieval evaluation metrics", () => {
    const relevance = {
        A: 2,
        B: 1,
        C: 3,
    };

    const retrieved = ["A", "X", "B", "Y", "Z"];

    it("calculates Precision@K", () => {
        expect(
            precisionAtK(retrieved, relevance, 5),
        ).toBeCloseTo(0.4);
    });

    it("calculates Recall@K", () => {
        expect(
            recallAtK(retrieved, relevance, 5),
        ).toBeCloseTo(2 / 3);
    });

    it("calculates reciprocal rank", () => {
        expect(
            reciprocalRankAtK(retrieved, relevance, 5),
        ).toBe(1);
    });

    it("returns zero when no relevant result is retrieved", () => {
        expect(
            reciprocalRankAtK(["X", "Y", "Z"], relevance, 3),
        ).toBe(0);
    });

    it("returns 1 for an ideal NDCG ranking", () => {
        expect(
            ndcgAtK(["C", "A", "B"], relevance, 3),
        ).toBeCloseTo(1);
    });

    it("gives a lower NDCG to a worse ranking", () => {
        const ideal = ndcgAtK(["C", "A", "B"], relevance, 3);
        const poor = ndcgAtK(["B", "A", "C"], relevance, 3);

        expect(poor).toBeLessThan(ideal);
    });

    it("handles empty retrieval results", () => {
        expect(precisionAtK([], relevance, 5)).toBe(0);
        expect(recallAtK([], relevance, 5)).toBe(0);
        expect(reciprocalRankAtK([], relevance, 5)).toBe(0);
        expect(ndcgAtK([], relevance, 5)).toBe(0);
    });

    it("rejects invalid K values", () => {
        expect(() => precisionAtK(retrieved, relevance, 0)).toThrow();
        expect(() => recallAtK(retrieved, relevance, -1)).toThrow();
    });
});
