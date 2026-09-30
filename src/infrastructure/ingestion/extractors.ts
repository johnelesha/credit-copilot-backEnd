import fs from "fs/promises";
import path from "path";
import { PDFParse } from "pdf-parse";
// import { marked } from "marked";

export async function extractTextFromFile(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === ".pdf") {
        const buffer = await fs.readFile(filePath);
        const parser = new PDFParse({ data: buffer });
        try {
            const data = await parser.getText();
            return data.text;
        } finally {
            await parser.destroy();
        }
    }

    if (ext === ".md") {
        const content = await fs.readFile(filePath, "utf-8");
        // Convert markdown to plain text (very simple)
        return content
            .replace(/[#*_`]/g, " ")
            .replace(/\n+/g, "\n")
            .trim();
    }

    if (ext === ".csv" || ext === ".xlsx") {
        // For now we just read CSV as text. We can improve later.
        return await fs.readFile(filePath, "utf-8");
    }

    throw new Error(`Unsupported file type: ${ext}`);
}
