import { v4 as uuidv4 } from "uuid";
import type { PolicyChunk } from "./types.js";

/**
 * Practical chunker for this document pack.
 * Splits mainly on clause patterns like CP-4.1, PM-2, C-1, PS-3, etc.
 */
export function chunkPolicyText(
    text: string,
    sourceFile: string,
    policyEdition?: PolicyChunk["policyEdition"],
    effectiveFrom?: string,
): PolicyChunk[] {
    const chunks: PolicyChunk[] = [];

    // Split by common clause headings
    const clauseRegex = /(?=(?:CP|PM|PS|C)-\d+(?:\.\d+)?)/g;
    const parts = text
        .split(clauseRegex)
        .map((p) => p.trim())
        .filter(Boolean);

    for (const part of parts) {
        const clauseMatch = part.match(/^(CP|PM|PS|C)-\d+(?:\.\d+)?/);
        const clauseId = clauseMatch ? clauseMatch[0] : undefined;

        // Skip very short noise
        if (part.length < 40) continue;

        const chunk: PolicyChunk = {
            chunkId: `${sourceFile}::${clauseId ?? uuidv4()}`,
            sourceFile,
            content: part,
            createdAt: new Date(),
            effectiveTo: null,
        };

        // Only add optional properties when they have a real value
        if (clauseId) chunk.clauseId = clauseId;
        if (policyEdition) chunk.policyEdition = policyEdition;
        if (effectiveFrom) chunk.effectiveFrom = effectiveFrom;

        chunks.push(chunk);
    }

    // Fallback: if almost nothing was found, create one big chunk
    if (chunks.length === 0 && text.trim().length > 0) {
        const chunk: PolicyChunk = {
            chunkId: `${sourceFile}::full`,
            sourceFile,
            content: text.trim(),
            createdAt: new Date(),
            effectiveTo: null,
        };

        if (policyEdition) chunk.policyEdition = policyEdition;
        if (effectiveFrom) chunk.effectiveFrom = effectiveFrom;

        chunks.push(chunk);
    }

    return chunks;
}
