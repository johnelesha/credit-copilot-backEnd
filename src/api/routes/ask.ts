import { Router } from "express";
import { askQuestion } from "../../application/askQuestion.js";

const router = Router();

/**
 * @openapi
 * /api/ask:
 *   post:
 *     tags: [Q&A]
 *     summary: Ask a policy question (grounded with citations)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question]
 *             properties:
 *               question:
 *                 type: string
 *                 example: What is the maximum debt burden ratio?
 *               policyEdition:
 *                 type: string
 *                 enum: [CP-2024, CP-2025]
 *                 example: CP-2025
 *     responses:
 *       200:
 *         description: Answer with citations, or refusal if not in corpus
 */
router.post("/ask", async (req, res, next) => {
    try {
        const { question, policyEdition } = req.body;

        if (!question || typeof question !== "string") {
            return res.status(400).json({ error: "question is required" });
        }

        const result = await askQuestion(question, policyEdition);

        res.json(result);
    } catch (err) {
        next(err);
    }
});

export default router;
