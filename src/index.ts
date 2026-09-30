import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./infrastructure/db/mongoose.js";
import mongoose from "mongoose";
import askRouter from './api/routes/ask.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api', askRouter);

app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        mongodb:
            mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    });
});

async function start() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

start();
