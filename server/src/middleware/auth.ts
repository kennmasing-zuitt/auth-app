import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import type { Role } from "../models/User";

export const COOKIE_NAME = "token";

export interface AuthPayload {
  sub: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: "Not authenticated" });
  try {
    req.auth = jwt.verify(token, config.jwtSecret) as unknown as AuthPayload;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
}

export function requireRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.auth?.role !== role) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}
