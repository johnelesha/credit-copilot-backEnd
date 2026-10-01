import type { ExtractedData } from "../../domain/application.js";

/**
 * Fake LLM extractor.
 * Returns predetermined data based on applicationId.
 * Used in tests and for offline pipeline runs.
 */
export class FakeExtractor {
    async extract(
        applicationId: string,
        _rawText: string,
    ): Promise<ExtractedData> {
        // APP-001 – the worked example (should approve under both policies for DBR)
        if (applicationId === "APP-001") {
            return {
                netMonthlyIncome: {
                    value: 30000,
                    sourceDocument: "APP-001.pdf",
                    sourceSection: "Salary certificate",
                    quotedText: "Net monthly income 30,000.00",
                },
                existingMonthlyObligations: {
                    value: 4000,
                    sourceDocument: "APP-001.pdf",
                    sourceSection: "Credit bureau summary",
                    quotedText: "Total monthly instalments EGP 4,000.00",
                },
                employmentStartDate: {
                    value: "2019-09-01",
                    sourceDocument: "APP-001.pdf",
                    sourceSection: "Salary certificate",
                    quotedText:
                        "employed by Horus Logistics S.A.E. since 1 September 2019",
                },
                bureauScore: {
                    value: 712,
                    sourceDocument: "APP-001.pdf",
                    sourceSection: "Credit bureau summary",
                    quotedText: "Bureau score 712",
                },
            };
        }

        // APP-003 – older applicant (age at maturity risk)
        if (applicationId === "APP-003") {
            return {
                netMonthlyIncome: {
                    value: 22000,
                    sourceDocument: "APP-003.pdf",
                    sourceSection: "Salary certificate",
                    quotedText: "Net monthly income 22,000.00",
                },
                existingMonthlyObligations: {
                    value: 2000,
                    sourceDocument: "APP-003.pdf",
                    sourceSection: "Credit bureau summary",
                    quotedText: "Total monthly instalments EGP 2,000.00",
                },
                employmentStartDate: {
                    value: "2005-03-15",
                    sourceDocument: "APP-003.pdf",
                    sourceSection: "Salary certificate",
                    quotedText: "employed with us since 15 March 2005",
                },
                bureauScore: {
                    value: 741,
                    sourceDocument: "APP-003.pdf",
                    sourceSection: "Credit bureau summary",
                    quotedText: "Bureau score 741",
                },
            };
        }

        // Default: invalid / missing → will trigger refer
        throw new Error("FakeExtractor: no data configured for " + applicationId);
    }
}
