import type { RuleResult, ApplicantData } from "./types.js"; // we will extend types below
import { getMaxDbr, getMinIncome } from "./policyEdition.js";

/**
 * Calculates age at the final instalment date.
 */
function calculateAgeAtMaturity(
    dateOfBirth: Date | string,
    applicationDate: Date | string,
    tenorMonths: number,
): number {
    const dob = new Date(dateOfBirth);
    const appDate = new Date(applicationDate);

    const maturityDate = new Date(appDate);
    maturityDate.setMonth(maturityDate.getMonth() + tenorMonths);

    let age = maturityDate.getFullYear() - dob.getFullYear();
    const monthDiff = maturityDate.getMonth() - dob.getMonth();

    if (
        monthDiff < 0 ||
        (monthDiff === 0 && maturityDate.getDate() < dob.getDate())
    ) {
        age--;
    }

    return age;
}

/**
 * Calculates months with current employer.
 */
function calculateEmploymentMonths(
    employmentStartDate: Date | string,
    applicationDate: Date | string,
): number {
    const start = new Date(employmentStartDate);
    const app = new Date(applicationDate);

    const years = app.getFullYear() - start.getFullYear();
    const months = app.getMonth() - start.getMonth();
    return years * 12 + months;
}

/**
 * Runs all eligibility and affordability rules.
 * Returns an array of RuleResult.
 */
export function evaluateRules(data: ApplicantData): RuleResult[] {
    const results: RuleResult[] = [];
    const edition = data.policyEdition;
    const maxDbr = getMaxDbr(edition);
    const minIncome = getMinIncome(edition);

    // CP-3.2 Employment duration (≥ 6 months)
    const employmentMonths = calculateEmploymentMonths(
        data.employmentStartDate,
        data.applicationDate,
    );
    results.push({
        rule: "CP-3.2 Employment duration",
        result: employmentMonths >= 6 ? "pass" : "fail",
        citation: `${edition} clause CP-3.2`,
        details: `Employed for ${employmentMonths} months`,
    });

    // CP-3.3 Minimum net monthly income
    results.push({
        rule: "CP-3.3 Minimum net monthly income",
        result: data.netMonthlyIncome >= minIncome ? "pass" : "fail",
        citation: `${edition} clause CP-3.3`,
        details: `Income ${data.netMonthlyIncome} vs minimum ${minIncome}`,
    });

    // CP-3.5 Maximum age at maturity (60)
    const ageAtMaturity = calculateAgeAtMaturity(
        data.dateOfBirth,
        data.applicationDate,
        data.requestedTenorMonths,
    );
    results.push({
        rule: "CP-3.5 Maximum age at maturity",
        result: ageAtMaturity <= 60 ? "pass" : "fail",
        citation: `${edition} clause CP-3.5`,
        details: `Age at maturity: ${ageAtMaturity}`,
    });

    // CP-3.6 Credit bureau score
    // Below 600 → Refer (not automatic decline)
    if (data.bureauScore < 600) {
        results.push({
            rule: "CP-3.6 Credit bureau score",
            result: "refer",
            citation: `${edition} clause CP-3.6`,
            details: `Score ${data.bureauScore} is below 600 → refer to human`,
        });
    } else {
        results.push({
            rule: "CP-3.6 Credit bureau score",
            result: "pass",
            citation: `${edition} clause CP-3.6`,
            details: `Score ${data.bureauScore}`,
        });
    }

    // CP-4.1 Maximum DBR
    results.push({
        rule: `CP-4.1 Maximum DBR ${(maxDbr * 100).toFixed(0)}%`,
        result: data.debtBurdenRatio <= maxDbr ? "pass" : "fail",
        citation: `${edition} clause CP-4.1`,
        details: `DBR ${(data.debtBurdenRatio * 100).toFixed(2)}%`,
    });

    // Product limits (basic – from product sheet)
    const amountOk =
        data.requestedAmount >= 20_000 && data.requestedAmount <= 1_000_000;
    const tenorOk =
        data.requestedTenorMonths >= 12 && data.requestedTenorMonths <= 60;

    results.push({
        rule: "PS-3 Amount & tenor limits",
        result: amountOk && tenorOk ? "pass" : "fail",
        citation: "Product Sheet PS-3",
        details: `Amount ${data.requestedAmount}, Tenor ${data.requestedTenorMonths} months`,
    });

    return results;
}

/**
 * Overall recommendation based on rule results.
 */
export function getRecommendation(
    results: RuleResult[],
): "approve" | "decline" | "refer" {
    if (results.some((r) => r.result === "refer")) return "refer";
    if (results.some((r) => r.result === "fail")) return "decline";
    return "approve";
}
