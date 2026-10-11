import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.EMBEDDING_MODEL ?? "text-embedding-3-small";

export const EMBEDDING_DIMENSIONS = 1536;

export async function generateEmbedding(
    text: string
): Promise<number[]> {
    const input = text.trim();

    if(!input) {
        throw new Error("Can not embed empty text");
    }

    const response = await client.embeddings.create({
        model: MODEL,
        input,
        dimensions: EMBEDDING_DIMENSIONS,
    });
    const embedding = response.data[0]?.embedding;

    if(
        !embedding ||
        embedding.length !== EMBEDDING_DIMENSIONS ||
        !embedding.every(Number.isFinite)
    ){
        throw new Error("Invalid embedding retuned by provider");
    }
    return embedding;
}