import { Schema, model, Document, Types } from "mongoose";

export interface ITranscriptEntry {
  speaker: "ai" | "candidate";
  text: string;
  timestamp: Date;
}

export interface IInterview extends Document {
  userId: Types.ObjectId;
  resumeId?: Types.ObjectId;
  githubProfileId?: Types.ObjectId;
  status: "pending" | "in-progress" | "completed";
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  currentQuestionIndex: number;
  followUpCount: number;
  questions: Array<{
    id: number;
    category: string;
    question: string;
    purpose: string;
  }>;
  transcript: ITranscriptEntry[];
  scores?: {
    technicalScore: number;
    communicationScore: number;
    confidenceScore: number;
    problemSolvingScore: number;
    behaviorScore: number;
    overallScore: number;
  };
  feedback?: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    summary: string;
  };
}

const InterviewSchema = new Schema<IInterview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    resumeId: { type: Schema.Types.ObjectId, ref: "Resume" },
    githubProfileId: { type: Schema.Types.ObjectId, ref: "GitHubProfile" },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
      default: "Intermediate",
    },
    currentQuestionIndex: { type: Number, default: 0 },
    followUpCount: { type: Number, default: 0 },
    questions: [
      {
        id: Number,
        category: String,
        question: String,
        purpose: String,
      },
    ],
    transcript: [
      {
        speaker: { type: String, enum: ["ai", "candidate"], required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    scores: {
      technicalScore: Number,
      communicationScore: Number,
      confidenceScore: Number,
      problemSolvingScore: Number,
      behaviorScore: Number,
      overallScore: Number,
    },
    feedback: {
      strengths: [String],
      weaknesses: [String],
      recommendations: [String],
      summary: String,
    },
  },
  { timestamps: true }
);

export const Interview = model<IInterview>("Interview", InterviewSchema);