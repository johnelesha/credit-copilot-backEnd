import type { EmbeddingProvider } from "./types.js";

export class GoogleEmbeddingProvider implements EmbeddingProvider {
    private apiKey: string;

    constructor(apiKey: string) {
        if (!apiKey) {
            throw new Error("GOOGLE_API_KEY is required");
        }
        this.apiKey = apiKey;
    }

    async embed(text: string): Promise<number[]> {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.apiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "models/text-embedding-004",
                content: {
                    parts: [{ text: text.slice(0, 8000) }],
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Google Embedding API error (${response.status}): ${errorText}`,
            );
        }

        const data = await response.json();
        return data.embedding.values as number[];
    }

    async embedMany(texts: string[]): Promise<number[][]> {
        const results: number[][] = [];
        for (const text of texts) {
            const vector = await this.embed(text);
            results.push(vector);
            // small delay to be nice to free tier
            await new Promise((r) => setTimeout(r, 200));
        }
        return results;
    }
}
