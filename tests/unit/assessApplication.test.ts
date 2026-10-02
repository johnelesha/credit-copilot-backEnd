import { describe, it, expect } from "vitest";
import { assessApplication } from "../../src/application/assessApplication.js";

describe("Assessment Pipeline (Fake LLM)", () => {
    // ─── 1. Approvable application (APP-001 worked example) ────────────
    it("approves APP-001 with correct calculation numbers under CP-2025", async () => {
        const result = await assessApplication({
            applicationId: "APP-001",
            applicationDate: "2025-04-03",
            dateOfBirth: "1987-04-12",
            requestedAmount: 300_000,
            requestedTenorMonths: 60,
            salaryTransferredToDelta: false,
            gender: "Male",
            religion: "Muslim",
            maritalStatus: "Married",
            nationality: "Egyptian",
            rawText: "dummy text for APP-001",
        });

        // Calculation under CP-2025 (max DBR 45%)
        expect(result.calculation.monthlyInstalment).toBe(8630.39);
        expect(Number(result.calculation.debtBurdenRatio.toFixed(4))).toBe(0.421);
        expect(result.calculation.maximumEligibleAmount).toBe(330_000); // ← fixed

        expect(result.policyEdition).toBe("CP-2025");
        expect(result.protectedAttributesRemoved).toEqual(
            expect.arrayContaining([
                "gender",
                "religion",
                "marital_status",
                "nationality",
            ]),
        );
        expect(result.recommendation).toBe("approve");
        expect(result.status).toBe("pending_approval");
        expect(result.steps.length).toBeGreaterThanOrEqual(4);
        expect(result.steps.some((s) => s.name === "validate_application")).toBe(
            true,
        );
    });

    // ─── 2. Over-age application (APP-003) ─────────────────────────────
    it("fails age-at-maturity rule for APP-003", async () => {
        const result = await assessApplication({
            applicationId: "APP-003",
            applicationDate: "2025-04-10",
            dateOfBirth: "1968-06-20", // will be ~61 at maturity with 60 months
            requestedAmount: 250_000,
            requestedTenorMonths: 60,
            rawText: "dummy text for APP-003",
        });

        expect(result.policyEdition).toBe("CP-2025");

        const ageRule = result.ruleResults.find((r) =>
            r.rule.includes("age at maturity"),
        );
        expect(ageRule).toBeDefined();
        expect(ageRule?.result).toBe("fail");

        expect(result.recommendation).toBe("decline");
    });

    // ─── 3. Invalid / missing LLM extraction → Refer ───────────────────
    it("refers when FakeExtractor has no data for the application", async () => {
        const result = await assessApplication({
            applicationId: "APP-999", // not configured in FakeExtractor
            applicationDate: "2025-04-01",
            dateOfBirth: "1990-01-01",
            requestedAmount: 100_000,
            requestedTenorMonths: 36,
            rawText: "some text",
        });

        expect(result.recommendation).toBe("refer");
        expect(result.status).toBe("refer");
        expect(result.memo).toMatch(/Extraction failed|incomplete/i);
    });

    // ─── 4. Fairness test ──────────────────────────────────────────────
    it("changing only protected attributes does not change the result", async () => {
        const base = {
            applicationId: "APP-001",
            applicationDate: "2025-04-03",
            dateOfBirth: "1987-04-12",
            requestedAmount: 300_000,
            requestedTenorMonths: 60,
            salaryTransferredToDelta: false,
            rawText: "dummy",
        };

        const resultA = await assessApplication({
            ...base,
            gender: "Male",
            religion: "Muslim",
            maritalStatus: "Married",
            nationality: "Egyptian",
        });

        const resultB = await assessApplication({
            ...base,
            gender: "Female",
            religion: "Christian",
            maritalStatus: "Single",
            nationality: "Other",
        });

        // Core decision must be identical
        expect(resultA.recommendation).toBe(resultB.recommendation);
        expect(resultA.calculation.monthlyInstalment).toBe(
            resultB.calculation.monthlyInstalment,
        );
        expect(resultA.calculation.debtBurdenRatio).toBe(
            resultB.calculation.debtBurdenRatio,
        );
        expect(resultA.calculation.maximumEligibleAmount).toBe(
            resultB.calculation.maximumEligibleAmount,
        );
        expect(resultA.policyEdition).toBe(resultB.policyEdition);
        expect(resultA.ruleResults.map((r) => r.result)).toEqual(
            resultB.ruleResults.map((r) => r.result),
        );
    });

    it("calculates max eligible 382000 under CP-2024 (50% DBR)", async () => {
        const result = await assessApplication({
            applicationId: "APP-001",
            applicationDate: "2024-06-01", // before 1 March 2025
            dateOfBirth: "1987-04-12",
            requestedAmount: 300_000,
            requestedTenorMonths: 60,
            rawText: "dummy",
        });

        expect(result.policyEdition).toBe("CP-2024");
        expect(result.calculation.maximumEligibleAmount).toBe(382_000);
    });
});
