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

const SEPARATORS = [
    "\n\n",
    "\n",
    ".",
    "?",
    "!",
    " ",
]

function findBoundry(
    windowText: string,
    chunkSize: number,
    chunkOverlap: number
): number | null {
    const minimumSize = Math.max(Math.ceil(chunkSize * 0.7), chunkOverlap + 1);

    for (const separator of SEPARATORS) {
        const position = windowText.lastIndexOf(separator);

        if (position === -1) {
            continue;
        }
        const boundryText = windowText.slice(0, position + separator.length);

        const tokenCount = encoding.encode(boundryText).length;

        if (tokenCount >= minimumSize && tokenCount <= chunkSize) {
            return tokenCount;
        }
    }
    return null;
}

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

    let startToken = 0;
    let chunkIndex = 0;

    while (startToken < tokens.length) {
        const maxEndToken = Math.min(startToken + chunkSize, tokens.length);
        let endToken = maxEndToken;

        if (maxEndToken < tokens.length) {
            const windowText = encoding.decode(tokens.slice(startToken, maxEndToken));
            const boundryTokenCount = findBoundry(
                windowText,
                chunkSize,
                chunkOverlap
            );
            if (boundryTokenCount !== null) {
                endToken = startToken + boundryTokenCount;
            }
        }

        const chunkTokens = tokens.slice(startToken, endToken);
        chunks.push({
            chunkIndex,
            content: encoding.decode(chunkTokens),
            startToken,
            endToken,
            tokenCount: chunkTokens.length
        });

        if (endToken === tokens.length) {
            break;
        }

        startToken = endToken - chunkOverlap;
        chunkIndex++;
    }
    
    return chunks;
}