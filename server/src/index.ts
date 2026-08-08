import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { ENV } from "./config/env";
import { connectDB } from "./config/db";
import authRoutes from "./routes/authRoutes";
import candidateRoutes from "./routes/candidateRoutes";
import interviewRoutes from "./routes/interviewRoutes";

const app = express();

// 1. Security HTTP Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for local development media streams
  })
);

// 2. Rate Limiting (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests from this IP address. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// 3. CORS Configuration
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);

app.use(express.json());

// Serve uploads statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/candidate", candidateRoutes);
app.use("/api/interview", interviewRoutes);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "AI Voice Interviewer Server running cleanly with Bun!" });
});

// 4. Global Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("[Global Error Handler]:", err.stack || err.message);
  res.status(err.status || 500).json({
    error: err.message || "An unexpected internal server error occurred.",
  });
});

// Start Server
const startServer = async () => {
  await connectDB();
  app.listen(ENV.PORT, () => {
    console.log(`[Server]: Server running natively with Bun on http://localhost:${ENV.PORT}`);
  });
};

startServer();