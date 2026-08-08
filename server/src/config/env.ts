import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/ai_interviewer",
  JWT_SECRET: process.env.JWT_SECRET || "super_secret_jwt_key_change_in_production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
};