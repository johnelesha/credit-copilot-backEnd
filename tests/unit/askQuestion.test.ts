import { describe, it, expect, vi, beforeEach } from "vitest";
import { askQuestion } from "../../src/application/askQuestion.js";
import * as searchModule from "../../src/infrastructure/retrieval/searchPolicy.js";

describe("askQuestion", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("returns refusal when no chunks are found", async () => {
        vi.spyOn(searchModule, "searchPolicy").mockResolvedValue([]);

        const result = await askQuestion("What is the policy on crypto loans?");

        expect(result.answer).toContain("do not contain enough information");
        expect(result.citations).toHaveLength(0);
        expect(result.reason).toBe("no_chunk_above_threshold");
    });

    it("returns answer and citations when chunks are found", async () => {
        vi.spyOn(searchModule, "searchPolicy").mockResolvedValue([
            {
                score: 10,
                chunk: {
                    chunkId: "test::CP-4.1",
                    sourceFile: "credit-policy-2025.pdf",
                    clauseId: "CP-4.1",
                    policyEdition: "CP-2025",
                    content:
                        "CP-4.1 Maximum debt burden ratio. The DBR must not exceed 45% of net monthly income.",
                    createdAt: new Date(),
                },
            },
        ]);

        const result = await askQuestion(
            "What is the maximum debt burden ratio?",
            "CP-2025",
        );

        expect(result.answer).toContain("45%");
        expect(result.citations.length).toBeGreaterThan(0);
        expect(result.citations[0].clauseId).toBe("CP-4.1");
        expect(result.citations[0].sourceFile).toBe("credit-policy-2025.pdf");
    });
});
