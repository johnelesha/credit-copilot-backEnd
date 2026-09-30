import { connectDB } from "../infrastructure/db/mongoose.js";
import { ingestAllPolicyDocuments } from "../infrastructure/ingestion/ingestPolicy.js";

async function main() {
    try {
        await connectDB();
        console.log("Starting policy ingestion...\n");

        const result = await ingestAllPolicyDocuments();

        console.log("\n==============================");
        console.log("Ingestion finished");
        console.log(`Files processed : ${result.processed}`);
        console.log(`Chunks upserted : ${result.upserted}`);
        console.log("Files:", result.files);
        console.log("==============================");

        process.exit(0);
    } catch (err) {
        console.error("Seed failed:", err);
        process.exit(1);
    }
}

main();
