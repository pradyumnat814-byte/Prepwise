import { z } from "zod";

export const QuestionOutputSchema = z.object({
  question: z.string().min(5),
  topic: z.string().min(2),
  difficulty: z.number().min(1).max(10),
  questionType: z.enum([
    "introduction",
    "resume",
    "github",
    "technical",
    "project",
    "problem_solving",
    "behavioral",
    "follow_up",
  ]),
  reasoning: z.string().optional(),
});

export type IGeneratedQuestion = z.infer<typeof QuestionOutputSchema>;

export const AnswerEvaluationSchema = z.object({
  technicalAccuracy: z.number().min(0).max(100),
  depth: z.number().min(0).max(100),
  problemSolving: z.number().min(0).max(100),
  communication: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  keyTakeaway: z.string().default(""),
  followUpNeeded: z.boolean().default(false),
});

export type IAnswerEvaluation = z.infer<typeof AnswerEvaluationSchema>;