import multer, { FileFilterCallback } from "multer";
import path from "path";
import { Request } from "express";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || ".webm";
    cb(null, `audio-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  // Accept standard audio formats recorded by browser MediaRecorder
  if (
    file.mimetype.startsWith("audio/") ||
    file.originalname.endsWith(".webm") ||
    file.originalname.endsWith(".wav") ||
    file.originalname.endsWith(".mp3")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Invalid audio file format. Only audio files are allowed."));
  }
};

export const uploadAudio = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max audio size
  },
});