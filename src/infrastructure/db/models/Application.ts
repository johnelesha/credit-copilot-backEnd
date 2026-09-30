import mongoose, { Schema, Document } from "mongoose";

export interface IApplication extends Document {
    applicationId: string; // APP-001, APP-002, ...
    sourceFile: string;
    rawText: string; // full extracted text (untrusted)
    status:
    | "uploaded"
    | "assessed"
    | "pending_approval"
    | "approved"
    | "rejected"
    | "issued";
    createdAt: Date;
    updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
    {
        applicationId: { type: String, required: true, unique: true, index: true },
        sourceFile: { type: String, required: true },
        rawText: { type: String, required: true },
        status: {
            type: String,
            enum: [
                "uploaded",
                "assessed",
                "pending_approval",
                "approved",
                "rejected",
                "issued",
            ],
            default: "uploaded",
        },
    },
    {
        timestamps: true,
        collection: "applications",
    },
);

export const ApplicationModel = mongoose.model<IApplication>(
    "Application",
    ApplicationSchema,
);
