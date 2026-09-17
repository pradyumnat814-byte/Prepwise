import mongoose, { Schema, Document } from "mongoose";
import { ICandidateProfile, IInterviewState, InterviewStage } from "../types/candidateProfile.types";
import { IAnswerEvaluation } from "../services/interview/interviewSchemas";

export interface IInterviewTurn {
  stage: InterviewStage;
  topic: string;
  difficulty: number;
  question: string;
  candidateAnswer: string;
  evaluation?: IAnswerEvaluation;
  weightedScore?: number;
  timestamp: Date;
}

export interface IInterviewDocument extends Document {
  userId: mongoose.Types.ObjectId;
  candidateProfile: ICandidateProfile;
  interviewState: IInterviewState;
  previousQuestions: string[];
  turns: IInterviewTurn[];
  status: "in_progress" | "completed";
  finalScore?: {
    technicalScore: number;
    communicationScore: number;
    confidenceScore: number;
    problemSolvingScore: number;
    depthScore: number;
    overallScore: number;
  };
  finalFeedback?: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    summary: string;
    hiringRecommendation: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    candidateProfile: { type: Object, required: true },
    interviewState: { type: Object, required: true },
    previousQuestions: { type: [String], default: [] },
    turns: [
      {
        stage: { type: String, required: true },
        topic: { type: String, required: true },
        difficulty: { type: Number, required: true },
        question: { type: String, required: true },
        candidateAnswer: { type: String, default: "" },
        evaluation: { type: Object },
        weightedScore: { type: Number },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    status: { type: String, enum: ["in_progress", "completed"], default: "in_progress" },
    finalScore: { type: Object },
    finalFeedback: { type: Object },
  },
  { timestamps: true }
);

export const Interview = mongoose.model("Interview", InterviewSchema);