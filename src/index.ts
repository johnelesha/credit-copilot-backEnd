import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./infrastructure/db/mongoose.js";
import mongoose from "mongoose";
import askRouter from "./api/routes/ask.js";
import assessRouter from "./api/routes/assess.js";
import approvalRouter from "./api/routes/approval.js";
import { DomainError } from "./domain/errors.js";
import authRouter from "./api/routes/auth.js";
// import { requireAuth, requireRole } from "./api/middleware/auth.js";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api", askRouter);
app.use("/api", assessRouter);
app.use("/api", approvalRouter);
app.use("/api", authRouter);

/* app.use(
    "/api/assess",
    requireAuth,
    requireRole("loan_officer", "credit_officer", "senior_credit_officer"),
); */

app.use((err: any, _req: any, res: any, _next: any) => {
    if (err instanceof DomainError) {
        return res.status(err.statusCode).json({
            error: {
                code: err.code,
                message: err.message,
            },
        });
    }

    console.error(err);
    return res.status(500).json({
        error: {
            code: "INTERNAL_ERROR",
            message: err.message || "Internal server error",
        },
    });
});

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
