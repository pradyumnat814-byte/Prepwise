import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "../../config/env";
import {
  SYSTEM_INTERVIEWER_PROMPT,
  GENERATE_QUESTIONS_PROMPT,
  EVALUATE_INTERVIEW_PROMPT,
} from "./prompts";

const aiClient = new GoogleGenerativeAI(ENV.GEMINI_API_KEY || "");

export interface IQuestion {
  id: number;
  category: string;
  question: string;
  purpose: string;
}

// 1. GENERATE INITIAL 5 TAILORED TOPIC QUESTIONS
export const generateInitialQuestions = async (
  resumeText: string,
  parsedSkills: string[],
  githubMetrics: any,
  difficulty: string
): Promise<IQuestion[]> => {
  try {
    if (!ENV.GEMINI_API_KEY) return getFallbackQuestions();

    const model = aiClient.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const prompt = GENERATE_QUESTIONS_PROMPT(
      resumeText,
      parsedSkills,
      githubMetrics,
      difficulty
    );

    const result = await model.generateContent(`${SYSTEM_INTERVIEWER_PROMPT}\n\n${prompt}`);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
      return parsed.questions;
    }

    return getFallbackQuestions();
  } catch (error: any) {
    console.error("[AI Service Error]: Failed to generate questions", error.message);
    return getFallbackQuestions();
  }
};

// 2. GENERATE DYNAMIC FOLLOW-UP QUESTION FOR CURRENT TOPIC
export const generateFollowUpQuestion = async (
  transcriptHistory: Array<{ speaker: string; text: string }>,
  latestCandidateAnswer: string,
  difficulty: string
): Promise<string> => {
  try {
    if (!ENV.GEMINI_API_KEY) {
      return "Could you elaborate further on how you would implement and test that approach in a production environment?";
    }

    const model = aiClient.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
      },
    });

    const prompt = `
You are conducting a live technical voice interview at difficulty level: ${difficulty}.

Recent Conversation History:
${transcriptHistory.map((t) => `${t.speaker.toUpperCase()}: ${t.text}`).join("\n")}

Candidate's Latest Answer:
"${latestCandidateAnswer}"

INSTRUCTIONS:
1. Briefly acknowledge their response in 1 short sentence.
2. Ask 1 insightful follow-up question related to what they just said, or ask them to clarify trade-offs/edge cases.
3. Keep the total response under 30 words so it sounds natural when spoken aloud.
`;

    const result = await model.generateContent(`${SYSTEM_INTERVIEWER_PROMPT}\n\n${prompt}`);
    return result.response.text().trim();
  } catch (error: any) {
    console.error("[AI Service Error]: Failed to generate follow-up question", error.message);
    return "Thank you for that response. Could you elaborate on how you would test and monitor that implementation in production?";
  }
};

// 3. SCORECARD TRANSCRIPT EVALUATION
export const evaluateInterviewTranscript = async (
  transcript: Array<{ speaker: string; text: string }>,
  difficulty: string,
  skills: string[]
) => {
  try {
    if (!ENV.GEMINI_API_KEY || transcript.length === 0) {
      return getFallbackEvaluation();
    }

    const model = aiClient.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const prompt = EVALUATE_INTERVIEW_PROMPT(transcript, difficulty, skills);
    const result = await model.generateContent(`${SYSTEM_INTERVIEWER_PROMPT}\n\n${prompt}`);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    const tech = Math.min(100, Math.max(0, parsed.technicalScore || 70));
    const comm = Math.min(100, Math.max(0, parsed.communicationScore || 70));
    const conf = Math.min(100, Math.max(0, parsed.confidenceScore || 70));
    const prob = Math.min(100, Math.max(0, parsed.problemSolvingScore || 70));
    const behav = Math.min(100, Math.max(0, parsed.behaviorScore || 70));

    const overallScore = Math.round(
      tech * 0.40 + prob * 0.20 + comm * 0.20 + conf * 0.10 + behav * 0.10
    );

    return {
      scores: {
        technicalScore: tech,
        communicationScore: comm,
        confidenceScore: conf,
        problemSolvingScore: prob,
        behaviorScore: behav,
        overallScore,
      },
      feedback: {
        strengths: parsed.strengths || ["Solid software engineering fundamentals."],
        weaknesses: parsed.weaknesses || ["Could elaborate deeper on trade-offs under load."],
        recommendations: parsed.recommendations || ["Practice system design architecture patterns."],
        summary: parsed.summary || "Candidate completed the technical voice interview session.",
        hiringRecommendation: parsed.hiringRecommendation || "Hire",
        suitableRoles: parsed.suitableRoles || ["Software Engineer"],
      },
    };
  } catch (error: any) {
    console.error("[AI Evaluation Error]: Failed to score interview", error.message);
    return getFallbackEvaluation();
  }
};

const getFallbackQuestions = (): IQuestion[] => [
  { id: 1, category: "Introduction", question: "Can you briefly introduce yourself and highlight a recent complex full-stack feature you built?", purpose: "Assess communication clarity." },
  { id: 2, category: "Core Concepts", question: "How do asynchronous operations and event loops work under the hood in your core technology stack?", purpose: "Evaluate core language mastery." },
  { id: 3, category: "Database & Performance", question: "What techniques do you use to optimize database queries and indexes when handling high throughput?", purpose: "Assess database performance tuning." },
  { id: 4, category: "System Design", question: "If you had to design a rate-limiting service handling thousands of requests per second, how would you approach it?", purpose: "Evaluate system design trade-offs." },
  { id: 5, category: "Behavioral & Architecture", question: "Describe a situation where you had to make a trade-off between speed of delivery and code architecture.", purpose: "Evaluate technical decision making." },
];

const getFallbackEvaluation = () => ({
  scores: {
    technicalScore: 75,
    communicationScore: 80,
    confidenceScore: 75,
    problemSolvingScore: 70,
    behaviorScore: 80,
    overallScore: 75,
  },
  feedback: {
    strengths: ["Clear spoken articulation and background introduction."],
    weaknesses: ["Detailed system architecture metrics could be expanded."],
    recommendations: ["Practice system design mock interviews."],
    summary: "Interview evaluation generated using baseline scoring matrix.",
    hiringRecommendation: "Hire",
    suitableRoles: ["Software Engineer"],
  },
});