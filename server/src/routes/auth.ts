import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { config } from "../config";
import { User } from "../models/User";
import { COOKIE_NAME, requireAuth, requireRole } from "../middleware/auth";

const router = Router();

// Forward async errors to Express's error handler (Express 4 doesn't do this itself)
const wrap =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };

// Throttle brute-force attempts: 10 login tries per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Try again later." },
});

// Used to keep response time similar whether or not the email exists
const DUMMY_HASH = bcrypt.hashSync("dummy-password", 10);

const cookieOptions = {
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: "lax" as const,
  path: "/",
};

router.post("/login", loginLimiter, wrap(async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
  const ok = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
  if (!user || !ok) return res.status(401).json({ message: "Invalid email or password" });

  const token = jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: config.sessionTtlSeconds,
  });

  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: config.sessionTtlSeconds * 1000 });
  return res.json({
    user: { firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role },
  });
}));

router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  return res.json({ message: "Logged out" });
});

router.get("/me", requireAuth, wrap(async (req, res) => {
  const user = await User.findById(req.auth!.sub);
  if (!user) return res.status(401).json({ message: "User not found" });
  return res.json({
    user: { firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role },
  });
}));

// Example admin-only endpoint
router.get("/admin-check", requireAuth, requireRole("admin"), (_req, res) => {
  res.json({ message: "You are an admin" });
});

export default router;
