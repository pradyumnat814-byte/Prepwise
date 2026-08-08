import { Router } from "express";
import {
  startInterviewSession,
  processCandidateResponse,
  completeAndEvaluateInterview,
} from "../controllers/interviewController";
import { authenticate } from "../middleware/auth";
import { uploadAudio } from "../middleware/audioUpload";

const router = Router();

// POST /api/interview/start - Starts interview
router.post("/start", authenticate, startInterviewSession);

// POST /api/interview/respond - Accepts spoken audio or text answer
router.post(
  "/respond",
  authenticate,
  uploadAudio.single("audio"),
  processCandidateResponse
);

// POST /api/interview/evaluate - Finalizes interview and generates scorecard
router.post("/evaluate", authenticate, completeAndEvaluateInterview);

export default router;