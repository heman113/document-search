export interface EvaluationCase {
    name: string;
    query: string;
    tenantId: string;
    relevantChunks: Record<string, number>;
    category: string;
    tags?: string[];
}

export const evaluationDataset: EvaluationCase[] = [
    // -----------------------------------------
    // Backend: org-a
    // -----------------------------------------
    {
        name: "Node.js Event Loop",
        query: "How does Node.js handle asynchronous operations and concurrent requests?",
        tenantId: "org-a",
        relevantChunks: {
            "eef45e2e-1918-4ab9-bf56-3551bef39eba": 3,
            "bef83242-6446-4630-b8a1-b60b5e69faf7": 1
        },
        category: "backend"
    },
    {
        name: "Node.js Worker Threads",
        query: "How can I execute CPU-intensive JavaScript operations in parallel?",
        tenantId: "org-a",
        relevantChunks: {
            "bef83242-6446-4630-b8a1-b60b5e69faf7": 3,
            "eef45e2e-1918-4ab9-bf56-3551bef39eba": 1
        },
        category: "backend"
    },
    {
        name: "JWT Authentication",
        query: "How can Express middleware authenticate requests and protect private routes using JWT?",
        tenantId: "org-a",
        relevantChunks: {
            "0affb15a-26a6-44e8-8322-60839051e522": 3,
            "3753d834-cb5c-44f2-aab2-9934913bb181": 2
        },
        category: "backend"
    },
    {
        name: "JWT Refresh Tokens",
        query: "How should an application securely manage access token expiration and refresh token rotation?",
        tenantId: "org-a",
        relevantChunks: {
            "3753d834-cb5c-44f2-aab2-9934913bb181": 3,
            "0affb15a-26a6-44e8-8322-60839051e522": 2
        },
        category: "backend"
    },
    {
        name: "API Rate Limiting",
        query: "How can I protect an API from excessive requests using Redis and rate limiting algorithms?",
        tenantId: "org-a",
        relevantChunks: {
            "aa43bf31-535f-417a-9c45-94a11d23e954": 3
        },
        category: "backend"
    },

    // -----------------------------------------
    // AI / Vector Search: org-a
    // -----------------------------------------
    {
        name: "RAG Fundamentals",
        query: "How does retrieval augmented generation provide relevant context to an LLM?",
        tenantId: "org-a",
        relevantChunks: {
            "d5ece2de-0aa1-478f-9dcb-38b98651cfd3": 3,
            "1e406a0a-d47c-4e02-8406-7bdf24516668": 3,
            "bf17570b-d03e-41f5-81ce-34650c26ff5b": 2
        },
        category: "ai"
    },
    {
        name: "RAG Pipeline",
        query: "What are the stages involved in building a document retrieval and generation pipeline?",
        tenantId: "org-a",
        relevantChunks: {
            "1e406a0a-d47c-4e02-8406-7bdf24516668": 3,
            "d5ece2de-0aa1-478f-9dcb-38b98651cfd3": 2
        },
        category: "ai"
    },
    {
        name: "Text Embeddings",
        query: "How are text converted into numerical vectors for semantic similarity search?",
        tenantId: "org-a",
        relevantChunks: {
            "bf17570b-d03e-41f5-81ce-34650c26ff5b": 3,
            "d5ece2de-0aa1-478f-9dcb-38b98651cfd3": 2
        },
        category: "ai"
    },
    {
        name: "PostgreSQL Vector Search",
        query: "How does PostgreSQL perform nearest neighbor search using pgvector and HNSW indexes?",
        tenantId: "org-a",
        relevantChunks: {
            "f15936f4-4723-451b-8b21-4528b36dd5b7": 3,
            "bf17570b-d03e-41f5-81ce-34650c26ff5b": 2
        },
        category: "ai"
    },

    // -----------------------------------------
    // Backend / Database: org-b
    // -----------------------------------------
    {
        name: "API Security",
        query: "What security practices should be implemented when exposing backend APIs?",
        tenantId: "org-b",
        relevantChunks: {
            "6b78b06a-5065-413a-8ad2-dc743088b92e": 3
        },
        category: "backend"
    },
    {
        name: "Redis Caching",
        query: "How can an application reduce database load and improve response times using caching?",
        tenantId: "org-b",
        relevantChunks: {
            "1568218c-5050-4805-ac9c-caa852bab0c7": 3
        },
        category: "backend"
    },
    {
        name: "Database Indexing",
        query: "Which PostgreSQL indexes improve query performance for arrays, JSONB, and range queries?",
        tenantId: "org-b",
        relevantChunks: {
            "ddfea873-0ecb-414a-93b2-cd062b53508f": 3
        },
        category: "database"
    },

    // -----------------------------------------
    // Distributed Systems: tenant-1
    // -----------------------------------------
    {
        name: "Distributed Systems Fundamentals",
        query: "What challenges arise when multiple independent computers coordinate over a network?",
        tenantId: "tenant-1",
        relevantChunks: {
            "8ade234f-4f15-40c5-b51d-47691eb7c4ea": 3,
            "fa366782-98b5-49d6-9977-f438254bb901": 1,
            "2e4361e8-0d5c-4bff-9ccc-d571065e7e1d": 2
        },
        category: "engineering"
    },
    {
        name: "Kafka Consumer Groups",
        query: "How do Kafka consumers distribute topic partitions and process messages in parallel?",
        tenantId: "tenant-1",
        relevantChunks: {
            "fa366782-98b5-49d6-9977-f438254bb901": 3,
            "2e4361e8-0d5c-4bff-9ccc-d571065e7e1d": 2
        },
        category: "engineering"
    },
    {
        name: "Microservices Communication",
        query: "What are the differences between synchronous and asynchronous communication in microservices?",
        tenantId: "tenant-1",
        relevantChunks: {
            "2e4361e8-0d5c-4bff-9ccc-d571065e7e1d": 3,
            "fa366782-98b5-49d6-9977-f438254bb901": 2
        },
        category: "engineering"
    }
];