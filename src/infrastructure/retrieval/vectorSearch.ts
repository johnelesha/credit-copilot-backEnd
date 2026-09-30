import { PolicyChunkModel } from "../db/models/PolicyChunk.js";
import type { PolicyChunk } from "../../domain/chunking/types.js";
import { GoogleEmbeddingProvider } from "../llm/googleEmbedding.js";

function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        const valueA = a[i];
        const valueB = b[i];
        if (valueA === undefined || valueB === undefined) continue;

        dot += valueA * valueB;
        normA += valueA * valueA;
        normB += valueB * valueB;
    }

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface VectorSearchOptions {
    query: string;
    policyEdition?: "CP-2024" | "CP-2025" | "PM" | "PS" | "CIRCULAR";
    limit?: number;
    minScore?: number; // relevance threshold
}

export interface VectorSearchResult {
    chunk: PolicyChunk;
    score: number;
}

export async function vectorSearch(
    options: VectorSearchOptions,
): Promise<VectorSearchResult[]> {
    const { query, limit = 5, minScore = 0.55 } = options;

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error("GOOGLE_API_KEY is required for vector search");
    }

    const embedder = new GoogleEmbeddingProvider(apiKey);
    const queryVector = await embedder.embed(query);

    const filter: Record<string, unknown> = {
        embedding: { $exists: true, $ne: [] },
    };

    if (options.policyEdition) {
        filter.policyEdition = options.policyEdition;
    }

    const chunks = await PolicyChunkModel.find(filter).lean();

    const results: VectorSearchResult[] = chunks
        .map((chunk) => {
            const score = cosineSimilarity(queryVector, chunk.embedding as number[]);
            return {
                chunk: chunk as PolicyChunk,
                score,
            };
        })
        .filter((r) => r.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    return results;
}
