import { Router } from "express";
import { uploadAndAnalyzeCandidate } from "../controllers/candidateController";
import { authenticate } from "../middleware/auth";
import { uploadResume } from "../middleware/upload";

const router = Router();

// Notice this is "/analyze" because it gets combined with "/api/candidate" in index.ts
router.post(
  "/analyze",
  authenticate,
  uploadResume.single("resume"),
  uploadAndAnalyzeCandidate
);

export default router;