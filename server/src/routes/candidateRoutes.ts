import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { analyzeCandidate } from "../controllers/candidateController";
import { authenticate } from "../middleware/auth";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

const router = Router();

router.post("/analyze", authenticate, upload.single("resume"), analyzeCandidate);

export default router;