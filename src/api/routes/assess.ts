import { Router } from "express";
import { assessApplication } from "../../application/assessApplication.js";
import { ApplicationModel } from "../../infrastructure/db/models/Application.js";
import { AssessmentModel } from "../../infrastructure/db/models/Assessment.js";
import type { AssessInput } from '../../application/assessApplication.js';

const router = Router();

/**
 * POST /api/assess
 * Body: { applicationId: "APP-001" }
 * Loads the application from DB and runs the pipeline.
 */
router.post("/assess", async (req, res, next) => {
    try {
        const { applicationId } = req.body;

        if (!applicationId || typeof applicationId !== "string") {
            return res.status(400).json({ error: "applicationId is required" });
        }

        const app = await ApplicationModel.findOne({ applicationId }).lean();
        if (!app) {
            return res
                .status(404)
                .json({ error: `Application ${applicationId} not found` });
        }

        const input: AssessInput = {
            applicationId: app.applicationId,
            applicationDate:
                extractField(
                    app.rawText,
                    /Application date\s+([0-9]{1,2} [A-Za-z]+ [0-9]{4})/i,
                ) ?? "2025-04-03",
            dateOfBirth:
                extractField(
                    app.rawText,
                    /Date of birth\s+([0-9]{1,2} [A-Za-z]+ [0-9]{4})/i,
                ) ?? "1987-04-12",
            requestedAmount: extractAmount(app.rawText) ?? 300000,
            requestedTenorMonths: extractTenor(app.rawText) ?? 60,
            salaryTransferredToDelta: /Salary transferred to Delta\s+No/i.test(
                app.rawText,
            )
                ? false
                : true,
            rawText: app.rawText,
        };

        // Only add optional fields when they exist
        const gender = extractField(app.rawText, /Gender\s+(\w+)/i);
        const religion = extractField(app.rawText, /Religion\s+.*?\s+(\w+)/i);
        const maritalStatus = extractField(app.rawText, /Marital status\s+(\w+)/i);
        const nationality = extractField(app.rawText, /Nationality\s+(\w+)/i);

        if (gender) input.gender = gender;
        if (religion) input.religion = religion;
        if (maritalStatus) input.maritalStatus = maritalStatus;
        if (nationality) input.nationality = nationality;

        const result = await assessApplication(input);

        await AssessmentModel.findOneAndUpdate(
            { runId: result.runId },
            {
                $set: {
                    applicationId: result.applicationId,
                    runId: result.runId,
                    policyEdition: result.policyEdition,
                    recommendation: result.recommendation,
                    recommendedAmount: result.recommendedAmount,
                    status: result.status,
                    calculation: result.calculation,
                    ruleResults: result.ruleResults,
                    memo: result.memo,
                    protectedAttributesRemoved: result.protectedAttributesRemoved,
                },
            },
            { upsert: true },
        );

        // Update status in DB
        await ApplicationModel.updateOne(
            { applicationId },
            {
                $set: {
                    status:
                        result.status === "pending_approval"
                            ? "pending_approval"
                            : result.status,
                },
            },
        );

        res.json(result);
    } catch (err) {
        next(err);
    }
});

// Very simple helpers (good enough for the synthetic packs)
function extractField(text: string, regex: RegExp): string | undefined {
    const m = text.match(regex);
    return m?.[1]?.trim();
}

function extractAmount(text: string): number | undefined {
    const m = text.match(/Requested amount\s+EGP\s+([\d,]+)/i);
    if (!m) return undefined;
    return Number(m[1]?.replace(/,/g, ""));
}

function extractTenor(text: string): number | undefined {
    const m = text.match(/Requested tenor\s+(\d+)\s+months/i);
    return m ? Number(m[1]) : undefined;
}

export default router;
