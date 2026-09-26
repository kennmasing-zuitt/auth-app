import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { config } from "./config";
import authRoutes from "./routes/auth";

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log("Connected to MongoDB");

  const app = express();
  app.set("trust proxy", 1); // behind Nginx — needed for correct client IPs (rate limiting)
  app.use(helmet());
  app.use(express.json({ limit: "10kb" }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRoutes);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  });

  app.listen(config.port, () => console.log(`Server listening on :${config.port}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
