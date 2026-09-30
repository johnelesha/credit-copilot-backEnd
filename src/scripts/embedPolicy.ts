import { connectDB } from "../infrastructure/db/mongoose.js";
import { PolicyChunkModel } from "../infrastructure/db/models/PolicyChunk.js";
import { GoogleEmbeddingProvider } from "../infrastructure/llm/googleEmbedding.js";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    await connectDB();

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("Missing GOOGLE_API_KEY");
        process.exit(1);
    }

    const embedder = new GoogleEmbeddingProvider(apiKey);

    // Only embed chunks that don't have an embedding yet
    const chunks = await PolicyChunkModel.find({
        $or: [{ embedding: { $exists: false } }, { embedding: { $size: 0 } }],
    }).lean();

    console.log(`Found ${chunks.length} chunks to embed...\n`);

    let success = 0;
    let failed = 0;

    for (const chunk of chunks) {
        try {
            const vector = await embedder.embed(chunk.content);
            await PolicyChunkModel.updateOne(
                { chunkId: chunk.chunkId },
                { $set: { embedding: vector } },
            );
            success++;
            console.log(`✓ ${chunk.chunkId}`);
        } catch (err) {
            failed++;
            console.error(`✗ ${chunk.chunkId}`, err);
        }
    }

    console.log("\n==============================");
    console.log(`Embedded : ${success}`);
    console.log(`Failed   : ${failed}`);
    console.log("==============================");

    process.exit(0);
}

main();
