import mongoose, { Schema, Document } from "mongoose";
import type { PolicyChunk } from "../../../domain/chunking/types.js";

export interface PolicyChunkDocument extends PolicyChunk, Document {
    embedding?: number[];
}

const PolicyChunkSchema = new Schema<PolicyChunkDocument>(
    {
        chunkId: { type: String, required: true, unique: true, index: true },
        sourceFile: { type: String, required: true, index: true },
        page: { type: Number },
        clauseId: { type: String, index: true },
        sectionTitle: { type: String },
        policyEdition: {
            type: String,
            enum: ["CP-2024", "CP-2025", "PM", "PS", "CIRCULAR"],
            index: true,
        },
        effectiveFrom: { type: String },
        effectiveTo: { type: String, default: null },
        content: { type: String, required: true },
        embedding: { type: [Number], default: undefined }, // vector
        createdAt: { type: Date, default: Date.now },
    },
    {
        collection: "policy_chunks",
    },
);

export const PolicyChunkModel = mongoose.model<PolicyChunkDocument>(
    "PolicyChunk",
    PolicyChunkSchema,
);
