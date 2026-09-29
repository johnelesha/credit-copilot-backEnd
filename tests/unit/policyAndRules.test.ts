import { describe, it, expect } from "vitest";
import {
    selectPolicyEdition,
    getMaxDbr,
} from "../../src/domain/policyEdition.js";
import { evaluateRules, getRecommendation } from "../../src/domain/rules.js";

describe("Policy Edition Selector", () => {
    it("returns CP-2024 for dates before 1 March 2025", () => {
        expect(selectPolicyEdition("2025-02-28")).toBe("CP-2024");
    });

    it("returns CP-2025 for dates on or after 1 March 2025", () => {
        expect(selectPolicyEdition("2025-03-01")).toBe("CP-2025");
        expect(selectPolicyEdition("2025-04-03")).toBe("CP-2025");
    });

    it("returns correct max DBR", () => {
        expect(getMaxDbr("CP-2024")).toBe(0.5);
        expect(getMaxDbr("CP-2025")).toBe(0.45);
    });
});

describe("Rules – APP-001 style case", () => {
    it("should approve the worked example under 2024 rules", () => {
        const results = evaluateRules({
            dateOfBirth: "1987-04-12",
            applicationDate: "2025-04-03",
            employmentStartDate: "2019-09-01",
            netMonthlyIncome: 30_000,
            existingMonthlyObligations: 4_000,
            bureauScore: 712,
            requestedAmount: 300_000,
            requestedTenorMonths: 60,
            monthlyInstalment: 8630.39,
            debtBurdenRatio: 0.421,
            policyEdition: "CP-2025",
        });

        const recommendation = getRecommendation(results);
        expect(recommendation).toBe("approve");
    });
});
