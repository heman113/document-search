import { pool } from "../db";
import { searchDocuments, type SearchMode } from "../search";
import { precisionAtK, recallAtK, reciprocalRankAtK, ndcgAtK } from "./metrics";
import { evaluationDataset } from "./dataset";

const K = 5;

interface MetricScores {
    precision: number;
    recall: number;
    mrr: number;
    ndcg: number;
}

function calculateMetrics(retrievedIds: string[], relevance: Record<string, number>): MetricScores {
    return {
        precision: precisionAtK(retrievedIds, relevance, K),
        recall: recallAtK(retrievedIds, relevance, K),
        mrr: reciprocalRankAtK(retrievedIds, relevance, K),
        ndcg: ndcgAtK(retrievedIds, relevance, K),
    }
}

function averageMetrics(scores: MetricScores[]): MetricScores {
    if (scores.length === 0) {
        return {
            precision: 0,
            recall: 0,
            mrr: 0,
            ndcg: 0
        }
    }

    const total = scores.reduce(
        (acc, score) => ({
            precision: acc.precision + score.precision,
            recall: acc.recall + score.recall,
            mrr: acc.mrr + score.recall,
            ndcg: acc.ndcg + score.ndcg
        }),
        {
            precision: 0,
            recall: 0,
            mrr: 0,
            ndcg: 0
        }
    );
    return {
        precision: total.precision / scores.length,
        recall: total.recall / scores.length,
        mrr: total.mrr / scores.length,
        ndcg: total.ndcg / scores.length,
    }
}

async function evaluateMode(mode: SearchMode) {
    const scores: MetricScores[] = [];

    console.log(`\nEvaluating ${mode.toUpperCase()} search`);
    console.log("=".repeat(50));

    for (const testCase of evaluationDataset) {
        const results = await searchDocuments(
            {
                tenantId: testCase.tenantId,
                query: testCase.query,
                category: testCase.category,
                tags: testCase.tags,
                limit: K
            },
            mode
        );
        const retrievedIds = results.map((result) => String(result.id));

        const metrics = calculateMetrics(retrievedIds, testCase.relevantChunks);
        scores.push(metrics);

        console.log(`\nQuery: ${testCase.name}`);
        console.log({
            retrieved: retrievedIds.length,
            ...metrics
        });
    }
    const averages = averageMetrics(scores);

    console.log("\nAverage metrics:");
    console.table(averages);

    return averages;
}

async function main() {
    if (evaluationDataset.length === 0) {
        throw new Error("Evaluation dataset is empty. Add evaluation cases first.");
    }
    try {
        const exactScores = await evaluateMode("exact");
        const annScores = await evaluateMode("ann");

        console.log("\nExact vs ANN comparison");
        console.table([
            {mode: "exact", ...exactScores},
            {mode: "ann", ...annScores}
        ]);
    } finally {
        pool.end();
    }
}

main().catch((error) => {
    console.error("Retrieval evaluation failed:", error);
    process.exitCode = 1;
});