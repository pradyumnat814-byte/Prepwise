import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  startInterviewSession,
  processCandidateResponse,
  completeAndEvaluateInterview,
} from "../controllers/interviewController";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
});

const router = Router();

// Route definitions
router.post("/start", startInterviewSession);
router.post("/respond", upload.single("audio"), processCandidateResponse);
router.post("/evaluate", completeAndEvaluateInterview);

export default router;