const PROTECTED_FIELDS = [
    "gender",
    "religion",
    "marital_status",
    "nationality",
] as const;

export type ProtectedField = (typeof PROTECTED_FIELDS)[number];

export interface StripResult<T extends Record<string, unknown>> {
    cleaned: Omit<T, ProtectedField>;
    removed: ProtectedField[];
}

/**
 * Removes protected attributes before any LLM call or rule check.
 * Pure function – no side effects.
 */
export function stripProtectedAttributes<T extends Record<string, unknown>>(
    data: T,
): StripResult<T> {
    const removed: ProtectedField[] = [];
    const cleaned = { ...data };

    for (const field of PROTECTED_FIELDS) {
        if (field in cleaned) {
            delete (cleaned as any)[field];
            removed.push(field);
        }
    }

    return { cleaned, removed };
}
