import type { CalculationInput, CalculationResult } from "./types.js";

/**
 * Reducing-balance installment
 * formula: P × r / (1 − (1 + r)^−n)
 * Rounded to 2 decimal places, half-up.
 */
export function calculateMonthlyInstalment(
    principal: number,
    annualRatePercent: number,
    tenorMonths: number,
): number {
    if (principal <= 0 || tenorMonths <= 0) return 0;

    const r = annualRatePercent / 100 / 12;

    if (r === 0) {
        return roundHalfUp(principal / tenorMonths, 2);
    }

    const factor = Math.pow(1 + r, -tenorMonths);
    const instalment = (principal * r) / (1 - factor);
    return roundHalfUp(instalment, 2);
}

/**
 * DBR = (existing obligations + new instalment) / net monthly income
 */
export function calculateDebtBurdenRatio(
    existingMonthlyObligations: number,
    newInstalment: number,
    netMonthlyIncome: number,
): number {
    if (netMonthlyIncome <= 0) return Infinity;
    return (existingMonthlyObligations + newInstalment) / netMonthlyIncome;
}

/**
 * Largest principal that keeps DBR ≤ maxDbr.
 * Rounded DOWN to the nearest 1,000 EGP.
 */
export function calculateMaximumEligibleAmount(
    netMonthlyIncome: number,
    existingMonthlyObligations: number,
    annualRatePercent: number,
    tenorMonths: number,
    maxDbr: number,
): number {
    const maxInstalment = netMonthlyIncome * maxDbr - existingMonthlyObligations;
    if (maxInstalment <= 0) return 0;

    const r = annualRatePercent / 100 / 12;
    let principal: number;

    if (r === 0) {
        principal = maxInstalment * tenorMonths;
    } else {
        const factor = Math.pow(1 + r, -tenorMonths);
        principal = (maxInstalment * (1 - factor)) / r;
    }

    return Math.floor(principal / 1000) * 1000;
}

export function calculateAll(
    input: CalculationInput,
    maxDbr: number,
): CalculationResult {
    const monthlyInstalment = calculateMonthlyInstalment(
        input.principal,
        input.annualRatePercent,
        input.tenorMonths,
    );

    const debtBurdenRatio = calculateDebtBurdenRatio(
        input.existingMonthlyObligations,
        monthlyInstalment,
        input.netMonthlyIncome,
    );

    const maximumEligibleAmount = calculateMaximumEligibleAmount(
        input.netMonthlyIncome,
        input.existingMonthlyObligations,
        input.annualRatePercent,
        input.tenorMonths,
        maxDbr,
    );

    return {
        monthlyInstalment,
        debtBurdenRatio,
        maximumEligibleAmount,
    };
}

function roundHalfUp(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor + Number.EPSILON) / factor;
}
