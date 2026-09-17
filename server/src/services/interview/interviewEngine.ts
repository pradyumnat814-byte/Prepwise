import { ICandidateProfile, IInterviewState } from "../../types/candidateProfile.types";
import {
  QuestionOutputSchema,
  IGeneratedQuestion,
  AnswerEvaluationSchema,
  IAnswerEvaluation,
} from "./interviewSchemas";

export class InterviewEngine {
  private static ollamaEndpoint = "http://127.0.0.1:11434/api/generate";
  private static model = "qwen2.5:3b";

  private static async callLocalLLM(prompt: string, maxTokens: number = 300): Promise {
    const res = await fetch(this.ollamaEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt: prompt,
        stream: false,
        format: "json",
        keep_alive: "1h",
        options: {
          temperature: 0.3,
          num_ctx: 2048,
          num_predict: maxTokens,
          top_k: 20,
          top_p: 0.8,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Local Ollama error: ${res.statusText}`);
    }

    const data = await res.json();
    const rawResponse = (data.response || "").trim();

    const sanitized = rawResponse
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    return JSON.parse(sanitized);
  }

  public static async generateQuestion(
    profile: ICandidateProfile,
    state: IInterviewState,
    previousQuestions: string[],
    turns: any[] = []
  ): Promise {
    const formattedHistory =
      previousQuestions.length > 0
        ? previousQuestions.map((q, idx) => `\({idx + 1}. "\){q}"`).join("\n")
        : "None";

    const lastTurn = turns.length > 0 ? turns[turns.length - 1] : null;
    const lastAnswer = lastTurn?.candidateAnswer || "";

    const candidateSkills =
      profile.skills && profile.skills.length > 0
        ? profile.skills
        : ["JavaScript", "Node.js", "React", "MongoDB", "Python", "SQL"];

    // Detect if candidate refused or doesn't know the topic (handles "type script", "no experience", etc.)
    const candidateRefusedTopic =
      Boolean(lastAnswer) &&
      /never use|never used|don't use|dont use|do not use|no experience|don't know|dont know|do not know|never worked/i.test(
        lastAnswer
      );

    // Filter out current topic and normalized variations
    const currentTopicNorm = (state.currentTopic || "").toLowerCase().replace(/\s+/g, "");
    const alternativeSkills = candidateSkills.filter(
      (s) => s.toLowerCase().replace(/\s+/g, "") !== currentTopicNorm
    );

    const targetTopic =
      candidateRefusedTopic && alternativeSkills.length > 0
        ? alternativeSkills[Math.floor(Math.random() * alternativeSkills.length)]
        : state.currentTopic || "JavaScript";

    let contextSection = "";
    if (lastTurn && lastAnswer) {
      contextSection = [
        "LAST CANDIDATE INTERACTION:",
        `- Question Asked: "${lastTurn.question}"`,
        `- Candidate Answer: "${lastAnswer}"`,
        candidateRefusedTopic
          ? `NOTE: The candidate stated they do not know or use "\({state.currentTopic}". Acknowledge this politely and pivot to "\){targetTopic}".`
          : `NOTE: Evaluate their answer depth and ask a relevant follow-up or next challenge on "${targetTopic}".`,
        "",
      ].join("\n");
    }

    const prompt = [
      "You are a professional, conversational AI technical interviewer.",
      `Candidate Profile: \({profile.name} (\){profile.experienceLevel} level)`,
      `Current Stage: ${state.currentStage.toUpperCase()}`,
      `Target Technical Topic: ${targetTopic}`,
      `Target Difficulty: ${state.difficulty}/10`,
      "",
      contextSection,
      "PREVIOUSLY ASKED QUESTIONS (DO NOT REPEAT):",
      formattedHistory,
      "",
      "INSTRUCTIONS:",
      "1. If the candidate declined or does not know the previous topic, start by saying 'Understood, let us pivot to [Topic]' and ask a question about that topic.",
      "2. Never repeat or rephrase questions from the list above.",
      "3. Keep the question under 25 words so speech synthesis sounds natural.",
      "",
      "Output strictly in this JSON format:",
      "{",
      '  "question": "question text to be spoken",',
      `  "topic": "${targetTopic}",`,
      `  "difficulty": ${state.difficulty},`,
      `  "questionType": "${state.currentStage}",`,
      '  "reasoning": "brief explanation"',
      "}",
    ].join("\n");

    try {
      const raw = await this.callLocalLLM(prompt, 160);
      return QuestionOutputSchema.parse(raw);
    } catch (err) {
      console.warn("[InterviewEngine]: Using fallback question:", err);
      return {
        question: candidateRefusedTopic
          ? `Understood, let's pivot. What has been your practical experience using ${targetTopic}?`
          : `Can you walk me through how you design and debug systems using ${targetTopic}?`,
        topic: targetTopic,
        difficulty: state.difficulty,
        questionType: state.currentStage as any,
        reasoning: "Dynamic fallback triggered",
      };
    }
  }

  public static async evaluateAnswer(
    question: string,
    candidateAnswer: string,
    topic: string,
    difficulty: number
  ): Promise<{ evaluation: IAnswerEvaluation; weightedScore: number }> {
    const trimmed = (candidateAnswer || "").trim();

    // 1. Audio noise or empty response
    const isAudioNoise =
      /^\(speaking in foreign language\)$/i.test(trimmed) ||
      /^\(inaudible\)$/i.test(trimmed) ||
      trimmed.length < 4;

    if (isAudioNoise) {
      const evaluation: IAnswerEvaluation = {
        technicalAccuracy: 0,
        depth: 0,
        problemSolving: 0,
        communication: 5,
        confidence: 5,
        strengths: ["Audio stream detected."],
        weaknesses: ["No audible response was provided."],
        keyTakeaway: "Unintelligible or blank answer.",
        followUpNeeded: true,
      };
      return { evaluation, weightedScore: 0 };
    }

    // 2. Explicit refusal or lack of knowledge
    const isRefusal =
      /never use|never used|don't use|dont use|do not use|no experience|don't know|dont know|do not know|never worked/i.test(
        trimmed
      );

    if (isRefusal) {
      const evaluation: IAnswerEvaluation = {
        technicalAccuracy: 10,
        depth: 0,
        problemSolving: 10,
        communication: 70,
        confidence: 60,
        strengths: ["Honest disclosure regarding skill limits."],
        weaknesses: [`Candidate explicitly lacks experience in ${topic}.`],
        keyTakeaway: `Candidate stated no experience with ${topic}.`,
        followUpNeeded: true,
      };
      const weightedScore = Math.round(10 * 0.4 + 10 * 0.2 + 70 * 0.2 + 60 * 0.1 + 0 * 0.1);
      return { evaluation, weightedScore };
    }

    // 3. Dynamic evaluation via Ollama
    const prompt = [
      "You are a strict, calibrated Technical Interview Evaluator.",
      `Question (Difficulty \({difficulty}/10 on "\){topic}"): "${question}"`,
      `Candidate Answer: "${trimmed}"`,
      "",
      "SCORING RUBRIC (0-100):",
      "- 0-30: Incoherent, completely incorrect, or avoids the question.",
      "- 31-60: Surface-level answer; lacks architectural depth or clear mechanics.",
      "- 61-80: Accurate technical explanation covering core concepts.",
      "- 81-100: Exceptional response with edge cases, trade-offs, and production considerations.",
      "",
      "Output strictly in this JSON format:",
      "{",
      '  "technicalAccuracy": 0,',
      '  "depth": 0,',
      '  "problemSolving": 0,',
      '  "communication": 0,',
      '  "confidence": 0,',
      '  "strengths": ["string"],',
      '  "weaknesses": ["string"],',
      '  "keyTakeaway": "string",',
      '  "followUpNeeded": false',
      "}",
    ].join("\n");

    try {
      const raw = await this.callLocalLLM(prompt, 300);
      const evaluation = AnswerEvaluationSchema.parse(raw);

      const weightedScore = Math.round(
        evaluation.technicalAccuracy * 0.4 +
          evaluation.problemSolving * 0.2 +
          evaluation.communication * 0.2 +
          evaluation.confidence * 0.1 +
          evaluation.depth * 0.1
      );

      return { evaluation, weightedScore };
    } catch (err) {
      console.warn("[InterviewEngine]: Fallback evaluation applied:", err);
      const fallbackEval: IAnswerEvaluation = {
        technicalAccuracy: 45,
        depth: 35,
        problemSolving: 40,
        communication: 60,
        confidence: 50,
        strengths: ["Attempted to address the technical concept."],
        weaknesses: ["Lacks specific production trade-offs."],
        keyTakeaway: "Basic competency shown.",
        followUpNeeded: false,
      };
      return { evaluation: fallbackEval, weightedScore: 45 };
    }
  }
}