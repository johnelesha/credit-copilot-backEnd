import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

export async function connectDB(): Promise<void> {
    if (!MONGODB_URI) {
        throw new Error("Missing MONGODB_URI in .env");
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ MongoDB Atlas connected successfully");
    } catch (error) {
        console.error("❌ Failed to connect to MongoDB Atlas:", error);
        throw error;
    }
}
