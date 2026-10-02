import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { AssessmentModel } from "../../infrastructure/db/models/Assessment.js";
import { AuthorityLimitExceeded } from "../../domain/errors.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

const AUTHORITY_LIMITS: Record<string, number> = {
    loan_officer: 0,
    credit_officer: 250_000,
    senior_credit_officer: 500_000,
    head_of_consumer_credit: 1_000_000,
};

function getRunId(req: Request): string {
    const id = req.params.runId;
    if (typeof id !== "string" || !id) {
        throw new Error("Invalid runId");
    }
    return id;
}

/**
 * @openapi
 * /api/assessments/{runId}/approve:
 *   post:
 *     tags: [Approval]
 *     summary: Approve an assessment (authority limit enforced)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: runId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assessment approved
 *       403:
 *         description: Role not allowed or authority limit exceeded
 *       404:
 *         description: Assessment not found
 */

router.post(
    "/assessments/:runId/approve",
    requireAuth,
    requireRole("credit_officer", "senior_credit_officer"),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const runId = getRunId(req);
            const role = req.user!.role;

            const assessment = await AssessmentModel.findOne({ runId }).exec();
            if (!assessment) {
                return res.status(404).json({ error: "Assessment not found" });
            }

            if (assessment.status !== "pending_approval") {
                return res.status(400).json({
                    error: `Cannot approve assessment with status ${assessment.status}`,
                });
            }

            const limit = AUTHORITY_LIMITS[role] ?? 0;

            if (assessment.recommendedAmount > limit) {
                throw new AuthorityLimitExceeded(
                    `Role "${role}" can approve up to ${limit} EGP. Recommended amount is ${assessment.recommendedAmount} EGP.`,
                );
            }

            assessment.status = "approved";
            assessment.approvedBy = role;
            assessment.approvedAt = new Date();
            await assessment.save();

            return res.json({
                message: "Assessment approved",
                runId: assessment.runId,
                status: assessment.status,
                approvedBy: assessment.approvedBy,
                approvedAt: assessment.approvedAt,
            });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * @openapi
 * /api/assessments/{runId}/reject:
 *   post:
 *     tags: [Approval]
 *     summary: Reject an assessment (comment required)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: runId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [comment]
 *             properties:
 *               comment:
 *                 type: string
 *                 example: Customer requested cancellation
 *     responses:
 *       200:
 *         description: Assessment rejected
 *       400:
 *         description: Missing comment or invalid status
 */

router.post(
    "/assessments/:runId/reject",
    requireAuth,
    requireRole("credit_officer", "senior_credit_officer"),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const runId = getRunId(req);
            const role = req.user!.role;
            const { comment } = req.body;

            if (!comment) {
                return res
                    .status(400)
                    .json({ error: "comment is required when rejecting" });
            }

            const assessment = await AssessmentModel.findOne({ runId }).exec();
            if (!assessment) {
                return res.status(404).json({ error: "Assessment not found" });
            }

            if (assessment.status !== "pending_approval") {
                return res.status(400).json({
                    error: `Cannot reject assessment with status ${assessment.status}`,
                });
            }

            assessment.status = "rejected";
            assessment.approvedBy = role;
            assessment.approvedAt = new Date();
            assessment.rejectionReason = comment;
            await assessment.save();

            return res.json({
                message: "Assessment rejected",
                runId: assessment.runId,
                status: assessment.status,
                rejectionReason: assessment.rejectionReason,
            });
        } catch (err) {
            next(err);
        }
    },
);

export default router;
