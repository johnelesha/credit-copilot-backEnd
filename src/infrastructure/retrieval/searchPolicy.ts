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
 * Improved keyword search with better ranking.
 */
export async function searchPolicy(
  options: SearchOptions,
): Promise<SearchResult[]> {
  const { query, limit = 5 } = options;

  if (!query.trim()) return [];

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
    "can",
    "should",
    "with",
    "from",
  ]);

  const keywords = query
    .toLowerCase()
    .replace(/[^\w\s%]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  if (keywords.length === 0) return [];

  const regexPattern = keywords.join("|");

  const filter: Record<string, unknown> = {
    content: { $regex: regexPattern, $options: "i" },
  };

  if (options.policyEdition) {
    filter.policyEdition = options.policyEdition;
  }

  const chunks = await PolicyChunkModel.find(filter).limit(30).lean();

  const results: SearchResult[] = chunks.map((chunk) => {
    const contentLower = chunk.content.toLowerCase();
    let score = 0;

    // 1. Basic keyword matches
    for (const word of keywords) {
      if (contentLower.includes(word)) {
        score += 1;
      }
    }

    // 2. Bonus for important phrases
    if (
      contentLower.includes("debt burden ratio") ||
      contentLower.includes("maximum dbr")
    ) {
      score += 5;
    }
    if (contentLower.includes("45%") || contentLower.includes("50%")) {
      score += 3;
    }
    if (contentLower.includes("maximum eligible amount")) {
      score += 4;
    }
    if (contentLower.includes("age at maturity")) {
      score += 3;
    }
    if (contentLower.includes("bureau score")) {
      score += 3;
    }

    // 3. Strong bonus if the clause ID looks like a real rule (CP-4.1, CP-3.5, etc.)
    if (chunk.clauseId && /^CP-\d+\.\d+$/.test(chunk.clauseId)) {
      score += 2;
    }

    // 4. Prefer shorter, more focused chunks slightly
    if (chunk.content.length < 600) {
      score += 1;
    }

    return {
      chunk: chunk as PolicyChunk,
      score,
    };
  });

  return results
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
