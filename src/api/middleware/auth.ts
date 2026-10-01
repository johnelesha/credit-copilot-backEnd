import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthPayload {
    sub: string;
    role: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid token" });
    }

    const token = header.slice(7);
    try {
        const secret = process.env.JWT_SECRET || "dev-secret";
        const payload = jwt.verify(token, secret) as AuthPayload;
        req.user = payload;
        next();
    } catch {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

export function requireRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden: insufficient role" });
        }
        next();
    };
}
