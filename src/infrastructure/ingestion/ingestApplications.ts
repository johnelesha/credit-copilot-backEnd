import path from "path";
import fs from "fs/promises";
import { extractTextFromFile } from "./extractors.js";
import { ApplicationModel } from "../db/models/Application.js";

const APPLICATIONS_DIR = path.join(process.cwd(), "data", "applications");

/**
 * Load all application packs into the untrusted store.
 * Idempotent: uses applicationId as unique key.
 */
export async function ingestAllApplications(): Promise<{
    processed: number;
    upserted: number;
    files: string[];
}> {
    const files = await fs.readdir(APPLICATIONS_DIR);
    const pdfFiles = files.filter((f) => f.toLowerCase().endsWith(".pdf"));

    let upserted = 0;
    const processedFiles: string[] = [];

    for (const file of pdfFiles) {
        const applicationId = path.basename(file, ".pdf").toUpperCase(); // APP-001
        const filePath = path.join(APPLICATIONS_DIR, file);

        console.log(`Processing application: ${file}`);

        try {
            const rawText = await extractTextFromFile(filePath);

            await ApplicationModel.updateOne(
                { applicationId },
                {
                    $set: {
                        applicationId,
                        sourceFile: file,
                        rawText,
                        status: "uploaded",
                    },
                },
                { upsert: true },
            );

            upserted++;
            processedFiles.push(file);
            console.log(`  → stored as ${applicationId}`);
        } catch (err) {
            console.error(`  ✗ Failed to process ${file}:`, err);
        }
    }

    return {
        processed: processedFiles.length,
        upserted,
        files: processedFiles,
    };
}
