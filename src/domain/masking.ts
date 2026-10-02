/**
 * Mask sensitive values before any LLM call or log.
 * Pure function – no side effects.
 */
export function maskSensitiveText(text: string): string {
    let result = text;

    // Egyptian-style national ID: 14 digits
    result = result.replace(/\b\d{14}\b/g, (id) => {
        return id.slice(0, 4) + "**********";
    });

    // Phone numbers: +20..., 01..., spaces/dashes allowed
    result = result.replace(
        /(?:\+?20|0)?1[0125]\d{8}\b/g,
        (phone) => phone.slice(0, 3) + "*******",
    );

    // Generic long digit sequences (10–13) that look like IDs
    result = result.replace(/\b\d{10,13}\b/g, (n) => {
        if (n.length === 14) return n; // already handled
        return n.slice(0, 3) + "*".repeat(n.length - 3);
    });

    return result;
}
