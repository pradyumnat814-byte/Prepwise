import fs from "fs";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface IAudioProcessResult {
  text: string;
}

const WHISPER_DIR = path.join(os.homedir(), "whisper.cpp");
const CMAKE_BIN = path.join(WHISPER_DIR, "build", "bin", "whisper-cli");
const ROOT_BIN = path.join(WHISPER_DIR, "whisper-cli");
const WHISPER_BIN = fs.existsSync(CMAKE_BIN) ? CMAKE_BIN : ROOT_BIN;
const MODEL_PATH = path.join(WHISPER_DIR, "models", "ggml-base.en.bin");

/**
 * Converts browser audio to WAV and transcribes it with whisper.cpp.
 */
export const processCandidateAudio = async (
  filePath: string
): Promise<IAudioProcessResult> => {
  if (!fs.existsSync(filePath)) {
    console.error(`[AudioService]: File does not exist at ${filePath}`);
    return { text: "" };
  }

  if (!fs.existsSync(WHISPER_BIN)) {
    console.error(
      `[AudioService]: whisper-cli executable not found at ${WHISPER_BIN}`
    );
    return { text: "" };
  }

  if (!fs.existsSync(MODEL_PATH)) {
    console.error(`[AudioService]: Model not found at ${MODEL_PATH}`);
    return { text: "" };
  }

  const tempWavPath = path.join(
    path.dirname(filePath),
    `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`
  );

  try {
    await execFileAsync("ffmpeg", [
      "-y",
      "-i",
      filePath,
      "-ar",
      "16000",
      "-ac",
      "1",
      "-c:a",
      "pcm_s16le",
      tempWavPath,
    ]);

    const { stdout } = await execFileAsync(WHISPER_BIN, [
      "-m",
      MODEL_PATH,
      "-f",
      tempWavPath,
      "--no-timestamps",
      "-nt",
    ]);

    const cleanText = stdout
      .split("\n")
      .map((line) =>
        line
          .replace(/\[\d{2}:\d{2}:\d{2}\.\d{3} --> .*?\]/g, "")
          .trim()
      )
      .filter(
        (line) =>
          line.length > 0 &&
          !line.startsWith("[") &&
          !line.startsWith("whisper_") &&
          !line.includes("system_info:")
      )
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    console.log(`[AudioService STT Transcript]: "${cleanText}"`);
    return { text: cleanText };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      "[AudioService Error]: Transcription execution failed:",
      message
    );
    return { text: "" };
  } finally {
    if (fs.existsSync(tempWavPath)) {
      try {
        fs.unlinkSync(tempWavPath);
      } catch (cleanupError) {
        console.warn(
          "[AudioService]: Could not remove temporary WAV:",
          cleanupError
        );
      }
    }
  }
};
