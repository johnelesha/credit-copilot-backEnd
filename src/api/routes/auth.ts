import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../../infrastructure/db/models/User.js";

const router = Router();

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login and get JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Token returned
 */
router.post("/auth/login", async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res
                .status(400)
                .json({ error: "username and password are required" });
        }

        const user = await UserModel.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const secret = process.env.JWT_SECRET || "dev-secret";

        const token = jwt.sign(
            { sub: user.username, role: user.role },
            secret,
            { expiresIn: 60 * 60 * 8 }, // 8 hours in seconds
        );

        res.json({
            token,
            user: { username: user.username, role: user.role },
        });
    } catch (err) {
        next(err);
    }
});

export default router;
