import { z } from "zod";

export const documentSchema = z.object({
    tenantId: z.string().min(1).max(100),
    externalId: z.string().min(1).max(200),
    title: z.string().trim().min(1).max(300),
    content: z.string().trim().min(1).max(20_000),
    category: z.string().trim().min(1).max(100),
    tags: z.array(z.string().trim().min(1).max(50)).max(30).default([]),
});

export const searchSchema = z.object({
    tenantId: z.string().min(1).max(100),
    query: z.string().trim().min(1).max(2_000),
    category: z.string().max(100).optional(),
    tags: z.array(z.string().min(1).max(50)).max(30).optional(),
    limit: z.number().int().min(1).max(20).default(5),
})

export type DocumentInput = z.infer<typeof documentSchema>;
export type SearchInput = z.infer<typeof searchSchema>;