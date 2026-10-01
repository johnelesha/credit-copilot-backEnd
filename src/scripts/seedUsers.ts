import bcrypt from "bcryptjs";
import { connectDB } from "../infrastructure/db/mongoose.js";
import { UserModel } from "../infrastructure/db/models/User.js";

async function main() {
    await connectDB();

    const users = [
        {
            username: "loan_officer",
            password: "loan123",
            role: "loan_officer" as const,
        },
        {
            username: "credit_officer",
            password: "credit123",
            role: "credit_officer" as const,
        },
        {
            username: "senior_officer",
            password: "senior123",
            role: "senior_credit_officer" as const,
        },
    ];

    for (const u of users) {
        const passwordHash = await bcrypt.hash(u.password, 10);
        await UserModel.updateOne(
            { username: u.username },
            { $set: { username: u.username, passwordHash, role: u.role } },
            { upsert: true },
        );
        console.log(`✓ ${u.username} / ${u.password} (${u.role})`);
    }

    process.exit(0);
}

main();
