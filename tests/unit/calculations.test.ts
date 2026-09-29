import { describe, it, expect } from "vitest";
import {
    calculateMonthlyInstalment,
    calculateDebtBurdenRatio,
    calculateMaximumEligibleAmount,
    calculateAll,
} from "../../src/domain/calculations.js";

describe("Calculations – Worked Example (Section 2.3)", () => {
    const principal = 300_000;
    const annualRate = 24;
    const tenor = 60;
    const netIncome = 30_000;
    const existing = 4_000;
    const maxDbr = 0.5;

    it("monthly instalment should be 8630.39", () => {
        const result = calculateMonthlyInstalment(principal, annualRate, tenor);
        expect(result).toBe(8630.39);
    });

    it("DBR should be 0.4210", () => {
        const instalment = calculateMonthlyInstalment(principal, annualRate, tenor);
        const dbr = calculateDebtBurdenRatio(existing, instalment, netIncome);
        expect(Number(dbr.toFixed(4))).toBe(0.421);
    });

    it("maximum eligible amount should be 382000", () => {
        const maxAmount = calculateMaximumEligibleAmount(
            netIncome,
            existing,
            annualRate,
            tenor,
            maxDbr,
        );
        expect(maxAmount).toBe(382_000);
    });

    it("calculateAll returns the three correct numbers", () => {
        const result = calculateAll(
            {
                principal,
                annualRatePercent: annualRate,
                tenorMonths: tenor,
                netMonthlyIncome: netIncome,
                existingMonthlyObligations: existing,
            },
            maxDbr,
        );

        expect(result.monthlyInstalment).toBe(8630.39);
        expect(Number(result.debtBurdenRatio.toFixed(4))).toBe(0.421);
        expect(result.maximumEligibleAmount).toBe(382_000);
    });
});
