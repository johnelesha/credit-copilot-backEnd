/**
 * Selects the credit policy edition that was in force on the application date.
 * Pure function – no database or LLM.
 *
 * CP-2024: effective from 1 Jan 2024
 * CP-2025: effective from 1 March 2025 (supersedes CP-2024)
 */
export function selectPolicyEdition(
    applicationDate: Date | string,
): "CP-2024" | "CP-2025" {
    const date =
        typeof applicationDate === "string"
            ? new Date(applicationDate)
            : applicationDate;

    if (isNaN(date.getTime())) {
        throw new Error("Invalid application date");
    }

    // CP-2025 starts on 1 March 2025
    const cp2025Start = new Date("2025-03-01T00:00:00Z");

    if (date >= cp2025Start) {
        return "CP-2025";
    }

    return "CP-2024";
}

/**
 * Returns the maximum DBR allowed by the selected edition.
 */
export function getMaxDbr(edition: "CP-2024" | "CP-2025"): number {
    return edition === "CP-2025" ? 0.45 : 0.5;
}

/**
 * Returns the minimum net monthly income required by the edition.
 */
export function getMinIncome(edition: "CP-2024" | "CP-2025"): number {
    return edition === "CP-2025" ? 10_000 : 8_000;
}
