import { v4 as uuidv4 } from "uuid";
import { ApplicationFormSchema } from "../domain/application.js";
import { stripProtectedAttributes } from "../domain/protected.js";
import { selectPolicyEdition, getMaxDbr } from "../domain/policyEdition.js";
import { calculateAll } from "../domain/calculations.js";
import { evaluateRules, getRecommendation } from "../domain/rules.js";
import {
    verifyExtractedNumber,
    verifyExtractedDate,
} from "../domain/verification.js";
import {
    InvalidApplication,
    UnverifiedExtraction,
    InvalidLLMOutput,
} from "../domain/errors.js";
import { FakeExtractor } from "../infrastructure/llm/fakeExtractor.js";
import type { ApplicantData } from "../domain/types.js";
import type { ExtractedData } from "../domain/application.js";
import type { AssessmentResult, StepLog } from "../domain/assessment.js";

/**
 * Pricing table (simplified for now).
 * Later we can load it from the CSV.
 */
function getAnnualRate(
    tenorMonths: number,
    salaryTransferred: boolean,
): number {
    if (salaryTransferred) {
        if (tenorMonths <= 36) return 20;
        if (tenorMonths <= 60) return 22;
        return 24;
    }
    // standard
    if (tenorMonths <= 36) return 22;
    if (tenorMonths <= 60) return 24;
    return 26;
}

export interface AssessInput {
    applicationId: string;
    applicationDate: string;
    dateOfBirth: string;
    requestedAmount: number;
    requestedTenorMonths: number;
    salaryTransferredToDelta?: boolean;
    // protected (will be stripped)
    gender?: string;
    religion?: string;
    maritalStatus?: string;
    nationality?: string;
    // raw text from the application pack (for extraction)
    rawText: string;
}

/**
 * Fixed 8-step assessment pipeline.
 * Uses FakeExtractor for now (no real LLM).
 */
export async function assessApplication(
    input: AssessInput,
): Promise<AssessmentResult> {
    const steps: StepLog[] = [];
    const runId = uuidv4();

    // ─── Step 1: Load & validate application ───────────────────────────
    const parsed = ApplicationFormSchema.safeParse({
        applicationId: input.applicationId,
        applicationDate: input.applicationDate,
        dateOfBirth: input.dateOfBirth,
        requestedAmount: input.requestedAmount,
        requestedTenorMonths: input.requestedTenorMonths,
        salaryTransferredToDelta: input.salaryTransferredToDelta ?? false,
        gender: input.gender,
        religion: input.religion,
        maritalStatus: input.maritalStatus,
        nationality: input.nationality,
    });

    if (!parsed.success) {
        throw new InvalidApplication(parsed.error.message);
    }

    const form = parsed.data;

    steps.push({
        step: 1,
        name: "validate_application",
        status: "ok",
        detail: `applicationId=${form.applicationId}`,
    });

    // ─── Step 2: Remove protected attributes ───────────────────────────
    const { cleaned, removed } = stripProtectedAttributes(
        form as Record<string, unknown>,
    );

    steps.push({
        step: 2,
        name: "strip_protected_attributes",
        status: "ok",
        detail: removed.length ? `removed: ${removed.join(", ")}` : "none",
    });

    // ─── Step 3: Find policy edition ───────────────────────────────────
    const policyEdition = selectPolicyEdition(form.applicationDate);
    const maxDbr = getMaxDbr(policyEdition);

    steps.push({
        step: 3,
        name: "select_policy_edition",
        status: "ok",
        detail: policyEdition,
    });
    // ─── Step 4: Extract applicant data (Fake LLM) ─────────────────────
    const extractor = new FakeExtractor();
    let extracted: ExtractedData;

    try {
        extracted = await extractor.extract(form.applicationId, input.rawText);
    } catch {
        steps.push({
            step: 4,
            name: "extract_applicant_data",
            status: "refer",
            detail: "extraction failed or incomplete",
        });
        // Missing or invalid extraction → refer to human
        return {
            applicationId: form.applicationId,
            policyEdition,
            protectedAttributesRemoved: removed,
            calculation: {
                monthlyInstalment: 0,
                debtBurdenRatio: 0,
                maximumEligibleAmount: 0,
                annualRatePercent: 0,
            },
            ruleResults: [],
            recommendation: "refer",
            recommendedAmount: form.requestedAmount,
            status: "refer",
            runId,
            memo: "Extraction failed or incomplete. Refer to human.",
            steps,
        };
    }

    // Verify each extracted value appears in the cited text
    try {
        verifyExtractedNumber(
            extracted.netMonthlyIncome.value,
            extracted.netMonthlyIncome.quotedText,
            "netMonthlyIncome",
        );
        verifyExtractedNumber(
            extracted.existingMonthlyObligations.value,
            extracted.existingMonthlyObligations.quotedText,
            "existingMonthlyObligations",
        );
        verifyExtractedNumber(
            extracted.bureauScore.value,
            extracted.bureauScore.quotedText,
            "bureauScore",
        );
        verifyExtractedDate(
            extracted.employmentStartDate.value,
            extracted.employmentStartDate.quotedText,
            "employmentStartDate",
        );
        steps.push({
            step: 4,
            name: "extract_and_verify",
            status: "ok",
            detail: "FakeExtractor + verification",
        });
    } catch (err) {
        if (err instanceof UnverifiedExtraction) {
            steps.push({
                step: 4,
                name: "extract_and_verify",
                status: "refer",
                detail: err.message,
            });
            return {
                applicationId: form.applicationId,
                policyEdition,
                protectedAttributesRemoved: removed,
                calculation: {
                    monthlyInstalment: 0,
                    debtBurdenRatio: 0,
                    maximumEligibleAmount: 0,
                    annualRatePercent: 0,
                },
                ruleResults: [],
                recommendation: "refer",
                recommendedAmount: form.requestedAmount,
                status: "refer",
                runId,
                memo: err.message,
                steps,
            };
        }
        throw err;
    }

    // ─── Step 5: Retrieve policy clauses (simplified for now) ──────────
    // We already have the rules engine using the correct edition.

    steps.push({
        step: 5,
        name: "retrieve_policy_context",
        status: "ok",
        detail: `edition=${policyEdition}`,
    });

    // ─── Step 6: Calculate & check rules ───────────────────────────────
    const annualRate = getAnnualRate(
        form.requestedTenorMonths,
        form.salaryTransferredToDelta ?? false,
    );

    const calculation = calculateAll(
        {
            principal: form.requestedAmount,
            annualRatePercent: annualRate,
            tenorMonths: form.requestedTenorMonths,
            netMonthlyIncome: extracted.netMonthlyIncome.value,
            existingMonthlyObligations: extracted.existingMonthlyObligations.value,
        },
        maxDbr,
    );

    const applicantData: ApplicantData = {
        dateOfBirth: form.dateOfBirth,
        applicationDate: form.applicationDate,
        employmentStartDate: extracted.employmentStartDate.value,
        netMonthlyIncome: extracted.netMonthlyIncome.value,
        existingMonthlyObligations: extracted.existingMonthlyObligations.value,
        bureauScore: extracted.bureauScore.value,
        requestedAmount: form.requestedAmount,
        requestedTenorMonths: form.requestedTenorMonths,
        monthlyInstalment: calculation.monthlyInstalment,
        debtBurdenRatio: calculation.debtBurdenRatio,
        policyEdition,
    };

    const ruleResults = evaluateRules(applicantData);
    const recommendation = getRecommendation(ruleResults);

    steps.push({
        step: 6,
        name: "calculate_and_rules",
        status:
            recommendation === "approve"
                ? "ok"
                : recommendation === "refer"
                    ? "refer"
                    : "fail",
        detail: `recommendation=${recommendation}`,
    });

    // ─── Step 7: Draft credit memo (simple for now) ────────────────────
    const memo = [
        `Application ${form.applicationId}`,
        `Policy edition: ${policyEdition}`,
        `Requested: ${form.requestedAmount} EGP over ${form.requestedTenorMonths} months`,
        `Instalment: ${calculation.monthlyInstalment}`,
        `DBR: ${(calculation.debtBurdenRatio * 100).toFixed(2)}%`,
        `Max eligible: ${calculation.maximumEligibleAmount}`,
        `Recommendation: ${recommendation}`,
        ...ruleResults.map((r) => `- ${r.rule}: ${r.result} (${r.details ?? ""})`),
    ].join("\n");

    steps.push({
        step: 7,
        name: "draft_memo",
        status: "ok",
    });

    // ─── Step 8: Status ────────────────────────────────────────────────
    let status: AssessmentResult["status"] = "pending_approval";
    if (recommendation === "refer") status = "refer";
    if (recommendation === "decline") status = "decline";

    steps.push({
        step: 8,
        name: "set_status",
        status:
            status === "pending_approval"
                ? "ok"
                : status === "refer"
                    ? "refer"
                    : "fail",
        detail: status,
    });

    return {
        applicationId: form.applicationId,
        policyEdition,
        protectedAttributesRemoved: removed,
        calculation: {
            ...calculation,
            annualRatePercent: annualRate,
        },
        ruleResults,
        recommendation,
        recommendedAmount: form.requestedAmount,
        status,
        runId,
        memo,
        steps,
    };
}
