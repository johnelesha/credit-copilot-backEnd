import path from "path";
import fs from "fs/promises";
import { extractTextFromFile } from "./extractors.js";
import { chunkPolicyText } from "../../domain/chunking/chunker.js";
import { PolicyChunkModel } from "../db/models/PolicyChunk.js";
import type { PolicyChunk } from "../../domain/chunking/types.js";

const POLICY_DIR = path.join(process.cwd(), "data", "policy");

/**
 * Decide edition + effective date from the file name
 */
function getMetadataFromFilename(filename: string): {
    edition?: PolicyChunk["policyEdition"];
    effectiveFrom?: string;
} {
    if (filename.includes("2024") && filename.includes("policy")) {
        return { edition: "CP-2024", effectiveFrom: "2024-01-01" };
    }
    if (filename.includes("2025") && filename.includes("policy")) {
        return { edition: "CP-2025", effectiveFrom: "2025-03-01" };
    }
    if (filename.includes("procedures")) {
        return { edition: "PM", effectiveFrom: "2025-03-01" };
    }
    if (filename.includes("product-sheet")) {
        return { edition: "PS", effectiveFrom: "2024-01-01" };
    }
    if (filename.includes("circular")) {
        return { edition: "CIRCULAR" };
    }
    return {};
}

/**
 * Ingest all policy documents.
 * Idempotent: uses chunkId as unique key → running twice does not create duplicates.
 */
export async function ingestAllPolicyDocuments(): Promise<{
    processed: number;
    upserted: number;
    files: string[];
}> {
    const files = await fs.readdir(POLICY_DIR);
    const supported = files.filter((f) =>
        [".pdf", ".md", ".csv"].includes(path.extname(f).toLowerCase()),
    );

    let totalUpserted = 0;
    const processedFiles: string[] = [];

    for (const file of supported) {
        const filePath = path.join(POLICY_DIR, file);
        console.log(`\nProcessing: ${file}`);

        try {
            const text = await extractTextFromFile(filePath);
            const meta = getMetadataFromFilename(file);

            const chunks = chunkPolicyText(
                text,
                file,
                meta.edition,
                meta.effectiveFrom,
            );

            for (const chunk of chunks) {
                await PolicyChunkModel.updateOne(
                    { chunkId: chunk.chunkId },
                    { $set: chunk },
                    { upsert: true },
                );
                totalUpserted++;
            }

            console.log(`  → ${chunks.length} chunks`);
            processedFiles.push(file);
        } catch (err) {
            console.error(`  ✗ Failed to process ${file}:`, err);
        }
    }

    return {
        processed: processedFiles.length,
        upserted: totalUpserted,
        files: processedFiles,
    };
}
