import { PolicyChunkModel } from "../db/models/PolicyChunk.js";
import type { PolicyChunk } from "../../domain/chunking/types.js";

export interface SearchOptions {
    query: string;
    policyEdition?: "CP-2024" | "CP-2025" | "PM" | "PS" | "CIRCULAR";
    limit?: number;
}

export interface SearchResult {
    chunk: PolicyChunk;
    score: number;
}

/**
 * Improved keyword search.
 * Splits the question into words and searches for any of them.
 */
export async function searchPolicy(
    options: SearchOptions,
): Promise<SearchResult[]> {
    const { query, limit = 5 } = options;

    if (!query.trim()) return [];

    // Extract meaningful words (ignore short/common words)
    const stopWords = new Set([
        "the",
        "is",
        "a",
        "an",
        "of",
        "for",
        "to",
        "in",
        "on",
        "and",
        "what",
        "how",
        "does",
        "do",
    ]);
    const keywords = query
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 2 && !stopWords.has(word));

    if (keywords.length === 0) return [];

    // Build a regex that matches any of the keywords
    const regexPattern = keywords.join("|");

    const filter: Record<string, unknown> = {
        content: { $regex: regexPattern, $options: "i" },
    };

    if (options.policyEdition) {
        filter.policyEdition = options.policyEdition;
    }

    const chunks = await PolicyChunkModel.find(filter).limit(20).lean(); // get more then re-rank

    // Score each chunk by how many keywords it contains
    const results: SearchResult[] = chunks.map((chunk) => {
        const contentLower = chunk.content.toLowerCase();
        let score = 0;

        for (const word of keywords) {
            if (contentLower.includes(word)) {
                score += 1;
            }
        }

        return {
            chunk: chunk as PolicyChunk,
            score,
        };
    });

    // Sort by score and return top results
    return results
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}
