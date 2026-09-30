import { connectDB } from "../infrastructure/db/mongoose.js";
import { ingestAllApplications } from "../infrastructure/ingestion/ingestApplications.js";

async function main() {
    try {
        await connectDB();
        console.log("Starting application packs ingestion...\n");

        const result = await ingestAllApplications();

        console.log("\n==============================");
        console.log("Applications ingestion finished");
        console.log(`Files processed : ${result.processed}`);
        console.log(`Upserted        : ${result.upserted}`);
        console.log("Files:", result.files);
        console.log("==============================");

        process.exit(0);
    } catch (err) {
        console.error("Seed failed:", err);
        process.exit(1);
    }
}

main();
