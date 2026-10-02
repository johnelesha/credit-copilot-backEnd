import type { CalculationResult, RuleResult } from "./types.js";

export type AssessmentStatus = "pending_approval" | "refer" | "decline";

export interface StepLog {
    step: number;
    name: string;
    status: "ok" | "refer" | "fail";
    detail?: string;
}

export interface AssessmentResult {
    applicationId: string;
    policyEdition: "CP-2024" | "CP-2025";
    protectedAttributesRemoved: string[];
    calculation: CalculationResult & { annualRatePercent: number };
    ruleResults: RuleResult[];
    recommendation: "approve" | "decline" | "refer";
    recommendedAmount: number;
    status: AssessmentStatus;
    runId: string;
    memo?: string;
    steps: StepLog[];
}
