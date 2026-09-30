import { Router } from "express";
import { askQuestion } from "../../application/askQuestion.js";

const router = Router();

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
