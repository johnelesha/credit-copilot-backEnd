import { UnverifiedExtraction } from "./errors.js";

/**
 * Checks that the extracted value actually appears in the quoted text.
 * Normalises numbers (removes commas, currency, spaces).
 */
export function verifyExtractedNumber(
    value: number,
    quotedText: string,
    fieldName: string,
): void {
    const normalisedQuote = quotedText.replace(/[, ]/g, "").toLowerCase();
    const valueStr = value.toString();

    // Also try with 2 decimal places
    const valueWithDecimals = value.toFixed(2).replace(/\.00$/, "");

    const found =
        normalisedQuote.includes(valueStr) ||
        normalisedQuote.includes(valueWithDecimals) ||
        normalisedQuote.includes(value.toLocaleString("en-US").replace(/,/g, ""));

    if (!found) {
        throw new UnverifiedExtraction(
            `Extracted ${fieldName}=${value} does not appear in quoted text: "${quotedText}"`,
        );
    }
}

export function verifyExtractedDate(
    value: string,
    quotedText: string,
    fieldName: string,
): void {
    // Simple check: the year or the full date should appear
    const year = value.slice(0, 4);
    if (!quotedText.includes(year) && !quotedText.includes(value)) {
        throw new UnverifiedExtraction(
            `Extracted ${fieldName}=${value} does not appear in quoted text: "${quotedText}"`,
        );
    }
}
