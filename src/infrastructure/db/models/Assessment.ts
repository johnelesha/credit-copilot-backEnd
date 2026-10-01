import mongoose, { Schema, Document } from "mongoose";

export interface IAssessment extends Document {
    applicationId: string;
    runId: string;
    policyEdition: string;
    recommendation: string;
    recommendedAmount: number;
    status:
    | "pending_approval"
    | "approved"
    | "rejected"
    | "issued"
    | "refer"
    | "decline";
    calculation: object;
    ruleResults: object[];
    memo?: string;
    protectedAttributesRemoved: string[];
    approvedBy?: string;
    approvedAt?: Date;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AssessmentSchema = new Schema<IAssessment>(
    {
        applicationId: { type: String, required: true, index: true },
        runId: { type: String, required: true, unique: true },
        policyEdition: { type: String, required: true },
        recommendation: { type: String, required: true },
        recommendedAmount: { type: Number, required: true },
        status: {
            type: String,
            enum: [
                "pending_approval",
                "approved",
                "rejected",
                "issued",
                "refer",
                "decline",
            ],
            default: "pending_approval",
        },
        calculation: { type: Object },
        ruleResults: { type: [Object] },
        memo: { type: String },
        protectedAttributesRemoved: { type: [String] },
        approvedBy: { type: String },
        approvedAt: { type: Date },
        rejectionReason: { type: String },
    },
    { timestamps: true, collection: "assessments" },
);

export const AssessmentModel = mongoose.model<IAssessment>(
    "Assessment",
    AssessmentSchema,
);
