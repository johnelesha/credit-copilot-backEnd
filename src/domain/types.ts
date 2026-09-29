export interface CalculationInput {
    principal: number; // loan amount
    annualRatePercent: number; // e.g. 24
    tenorMonths: number;
    netMonthlyIncome: number;
    existingMonthlyObligations: number;
}

export interface CalculationResult {
    monthlyInstalment: number;
    debtBurdenRatio: number; // e.g. 0.4210
    maximumEligibleAmount: number;
}
