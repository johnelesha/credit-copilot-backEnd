import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        mongodb:
            mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    });
});

async function start() {
    if (!MONGODB_URI) {
        console.error("Missing MONGODB_URI in .env");
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ MongoDB Atlas connected successfully");

        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ Failed to connect to MongoDB Atlas:", error);
        process.exit(1);
    }
}

start();
