import { searchPolicy } from "../infrastructure/retrieval/searchPolicy.js";
// import { vectorSearch } from "../infrastructure/retrieval/vectorSearch.js";

export interface AskResult {
    answer: string;
    citations: {
        sourceFile: string;
        clauseId?: string;
        policyEdition?: string;
        snippet: string;
    }[];
    reason?: string;
}

const OUT_OF_DOMAIN = [
    "crypto",
    "bitcoin",
    "mortgage",
    "islamic",
    "ceo",
    "salary of",
    "ignore previous",
    "ignore all previous",
];

/**
 * Basic grounded answer.
 * If no good chunks are found → refuse.
 */
export async function askQuestion(
    question: string,
    policyEdition?: "CP-2024" | "CP-2025",
): Promise<AskResult> {
    const q = question.toLowerCase();

    // Hard refusal for clearly out-of-scope questions
    if (OUT_OF_DOMAIN.some((w) => q.includes(w))) {
        return {
            answer:
                "The documents do not contain enough information to answer this question.",
            citations: [],
            reason: "no_chunk_above_threshold",
        };
    }

    const searchOptions: Parameters<typeof searchPolicy>[0] = {
        query: question,
        limit: 5,
        // minScore: 0.55,
    };

    if (policyEdition) {
        searchOptions.policyEdition = policyEdition;
    }

    const results = await searchPolicy(searchOptions);
    const topResult = results[0];

    if (
        results.length === 0 ||
        !topResult ||
        topResult.score < 2 ||
        (topResult.score === 1 && results.length < 2)
    ) {
        return {
            answer:
                "The documents do not contain enough information to answer this question.",
            citations: [],
            reason: "no_chunk_above_threshold",
        };
    }

    const citations = results.map((r) => {
        const citation: {
            sourceFile: string;
            clauseId?: string;
            policyEdition?: string;
            snippet: string;
        } = {
            sourceFile: r.chunk.sourceFile,
            snippet:
                r.chunk.content.slice(0, 300) +
                (r.chunk.content.length > 300 ? "..." : ""),
        };

        if (r.chunk.clauseId) citation.clauseId = r.chunk.clauseId;
        if (r.chunk.policyEdition) citation.policyEdition = r.chunk.policyEdition;

        return citation;
    });

    const answer = results
        .map((r, i) => `[${i + 1}] ${r.chunk.content.slice(0, 400)}...`)
        .join("\n\n");

    return {
        answer,
        citations,
    };
}
