const PROTECTED_FIELDS = [
    "gender",
    "religion",
    "marital_status",
    "maritalStatus",
    "nationality",
] as const;

export type ProtectedField = (typeof PROTECTED_FIELDS)[number];

export interface StripResult<T extends Record<string, unknown>> {
    cleaned: Omit<T, ProtectedField>;
    removed: string[];
}

/**
 * Removes protected attributes before any LLM call or rule check.
 * Pure function – no side effects.
 */
export function stripProtectedAttributes<T extends Record<string, unknown>>(
    data: T,
): StripResult<T> {
    const removed: string[] = [];
    const cleaned = { ...data };

    for (const field of PROTECTED_FIELDS) {
        if (field in cleaned) {
            delete (cleaned as any)[field];
            // Normalize the name we report
            const normalised = field === "maritalStatus" ? "marital_status" : field;
            if (!removed.includes(normalised)) {
                removed.push(normalised);
            }
        }
    }

    return { cleaned, removed };
}
