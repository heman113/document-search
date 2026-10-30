import { getEncoding } from "js-tiktoken";

const encoding = getEncoding("cl100k_base");

export interface Chunk {
    chunkIndex: number;
    content: string;
    startToken: number;
    endToken: number;
    tokenCount: number;
}

interface ChunkOptions {
    chunkSize?: number;
    chunkOverlap?: number;
}

const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_CHUNK_OVERLAP = 150;

export function chunkDocument(
    text: string,
    options: ChunkOptions = {}
): Chunk[] {

    const normalizedtext = text.trim();

    if (!normalizedtext) {
        return [];
    }

    const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
    const chunkOverlap = options.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP;

    if(!Number.isInteger(chunkSize) || chunkSize <= 0) {
        throw new Error("Chunk size must be a positive integer.");
    }

    if(!Number.isInteger(chunkOverlap) || chunkOverlap < 0 || chunkOverlap >= chunkSize) {
        throw new Error("Chunk overlap must be positive and smaller than chunk size.");
    }

    const tokens = encoding.encode(normalizedtext);
    const chunks: Chunk[] = [];

    const step = chunkSize - chunkOverlap;

    for (
        let startToken = 0, chunkIndex = 0;
        startToken < tokens.length;
        startToken += step, chunkIndex++
    ) {
        const endToken = Math.min(startToken + chunkSize, tokens.length);
        const chunkTokens = tokens.slice(startToken, endToken);
        const content = encoding.decode(chunkTokens);

        chunks.push({
            chunkIndex,
            content,
            startToken,
            endToken,
            tokenCount: endToken - startToken,
        });
    }
    return chunks;
}