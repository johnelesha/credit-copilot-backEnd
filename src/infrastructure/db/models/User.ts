import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "loan_officer" | "credit_officer" | "senior_credit_officer";

export interface IUser extends Document {
    username: string;
    passwordHash: string;
    role: UserRole;
}

const UserSchema = new Schema<IUser>({
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: {
        type: String,
        enum: ["loan_officer", "credit_officer", "senior_credit_officer"],
        required: true,
    },
});

export const UserModel = mongoose.model<IUser>("User", UserSchema);
