import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.EMBEDDING_MODEL ?? "text-embedding-3-small";

export const EMBEDDING_DIMENSIONS = 1536;
const DEFAULT_BATCH_SIZE = 64;

function validateEmbedding(embedding: number[]): void {
    if (embedding.length !== EMBEDDING_DIMENSIONS || !embedding.every(Number.isFinite)) {
        throw new Error("Invalid embedding returned by model.");
    }
}

export async function generateEmbeddings(
    texts: string[],
    batchSize = DEFAULT_BATCH_SIZE
): Promise<number[][]> {

    if (texts.length === 0) {
        return [];
    }

    if (!Number.isInteger(batchSize) || batchSize <= 0) {
        throw new Error("Batch size must be a positive integer.");
    }

    const inputs = texts.map((text) => text.trim());

    if (inputs.some((text) => !text)) {
        throw new Error("Cannot embed empty text");
    }

    const allEmbeddings: number[][] = [];

    for (let i = 0; i < inputs.length; i += batchSize) {
        const batch = inputs.slice(i, i+batchSize);

        const response = await client.embeddings.create({
            model: MODEL,
            input: batch,
            dimensions: EMBEDDING_DIMENSIONS
        });

        if (response.data.length !== batch.length) {
            throw new Error("Embedding count does not match input count");
        }

        const orderedEmbeddings: number[][] = new Array(batch.length);
        for (const item of response.data) {
            const index = item.index;

            if (
                !Number.isFinite(index) ||
                index < 0 ||
                index>= batch.length ||
                orderedEmbeddings[index] !== undefined
            ) {
                throw new Error("Invalid embedding response indexs");
            }
            validateEmbedding(item.embedding);
            orderedEmbeddings[index] = item.embedding;
        }

        if (orderedEmbeddings.some((embedding) => embedding === undefined)) {
            throw new Error("Missing embeddings in provider response");
        }

        allEmbeddings.push(...orderedEmbeddings);

    }

    return allEmbeddings;
}

export async function generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await generateEmbeddings([text]);
    return embeddings[0];
}