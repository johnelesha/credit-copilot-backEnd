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

export type RuleStatus = "pass" | "fail" | "refer";

export interface RuleResult {
    rule: string;
    result: RuleStatus;
    citation: string;
    details?: string;
}

export interface ApplicantData {
    dateOfBirth: Date | string;
    applicationDate: Date | string;
    employmentStartDate: Date | string;
    netMonthlyIncome: number;
    existingMonthlyObligations: number;
    bureauScore: number;
    requestedAmount: number;
    requestedTenorMonths: number;
    monthlyInstalment: number;
    debtBurdenRatio: number;
    policyEdition: "CP-2024" | "CP-2025";
}
