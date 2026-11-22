export type RelevanceJudgements = Record<string, number>;

function validateK(k: number): void {
    if (!Number.isInteger(k) || k <= 0) {
        throw new Error("K must be a positive integer");
    }
}

function validateRelevance(relevance: RelevanceJudgements): void {
    for (const score of Object.values(relevance)) {
        if (!Number.isFinite(score) || score < 0) {
            throw new Error("Relevance scores must be non-negative numbers");
        }
    }
}

export function precisionAtK(
    retrievedIds: string[],
    relevance: RelevanceJudgements,
    k: number
): number {
    validateK(k);
    validateRelevance(relevance);

    const topK = retrievedIds.slice(0, k);

    if (topK.length === 0) {
        return 0;
    }

    const relevantRetrieved = topK.filter(
        (id) => (relevance[id] ?? 0) > 0 
    ).length;

    return relevantRetrieved / k;
}

export function recallAtK(
    retrievedIds: string[],
    relevance: RelevanceJudgements,
    k: number
): number {
    validateK(k);
    validateRelevance(relevance);

    const totalRelevant = Object.values(relevance).filter(
        (score) => score > 0
    ).length;

    if (totalRelevant === 0) {
        return 0;
    }

    const topK = retrievedIds.slice(0, k);

    const relevantRetrieved = new Set(
        topK.filter((id) => (relevance[id] ?? 0) > 0)
    ).size;

    return relevantRetrieved / totalRelevant;
}

export function reciprocalRankAtK(
    retrievedIds: string[],
    relevance: RelevanceJudgements,
    k: number
): number {
    validateK(k);
    validateRelevance(relevance);

    const topK = retrievedIds.slice(0, k);

    const firstRelevantIndex = topK.findIndex(
        (id) => (relevance[id] ?? 0) > 0
    );

    return firstRelevantIndex === -1 ? 0 : 1 / (firstRelevantIndex + 1);
}

function dcgAtK(
    retrievedIds: string[],
    relevance: RelevanceJudgements,
    k: number
): number {
    return retrievedIds.slice(0, k).reduce((dcg, id, index) => {
        const score = relevance[id] ?? 0;
        const gain = Math.pow(2, score) - 1;
        const discount = Math.log2(index + 2);

        return dcg + gain / discount;
    }, 0);
}

export function ndcgAtK(
    retrievedIds: string[],
    relevance: RelevanceJudgements,
    k: number
): number {
    validateK(k);
    validateRelevance(relevance);

    const idealRelevance = Object.entries(relevance)
        .filter(([,score]) => score > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id);

    const idealDcg = dcgAtK(idealRelevance, relevance, k);

    if (idealDcg === 0) {
        return 0;
    }

    const actualDcg = dcgAtK(retrievedIds, relevance, k);
    return actualDcg / idealDcg;
}