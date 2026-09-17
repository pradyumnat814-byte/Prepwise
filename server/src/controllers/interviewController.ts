import { Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middleware/auth";
import { Interview } from "../models/Interview";
import { CandidateProfileService } from "../services/candidate/candidateProfileService";
import { InterviewStateMachine, STAGE_ORDER } from "../services/interview/stateMachine";
import { DifficultyEngine } from "../services/interview/difficultyEngine";
import { InterviewEngine } from "../services/interview/interviewEngine";
import { processCandidateAudio } from "../services/audio/audioService";

const getSafeUserId = (req: AuthenticatedRequest): mongoose.Types.ObjectId => {
  const rawId = (req as any).userId || (req as any).user?.id || (req as any).user?._id;
  if (rawId && mongoose.Types.ObjectId.isValid(rawId)) {
    return new mongoose.Types.ObjectId(rawId);
  }
  return new mongoose.Types.ObjectId("000000000000000000000001");
};

export const startInterview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise => {
  try {
    const userId = getSafeUserId(req);
    const { candidateProfile: incomingProfile } = req.body;

    // 1. Use the dynamically scraped profile if sent; otherwise fallback
    let profile = incomingProfile;
    if (!profile || !profile.skills || profile.skills.length === 0) {
      profile = CandidateProfileService.buildProfile(
        "Candidate",
        ["JavaScript", "Python", "React", "Node.js", "SQL"],
        { public_repos: 5, topLanguages: ["JavaScript", "Python"], topRepositories: [] },
        "intermediate"
      );
    }

    // 2. Initialize state machine with candidate's actual experience level
    const initialState = InterviewStateMachine.initializeState(profile.experienceLevel, 5);

    // 3. Dynamically pick the first topic from the candidate's actual skills
    initialState.currentTopic = profile.skills[0] || "General Software Engineering";

    // 4. Generate the very first question tailored to their genuine skills
    const firstQ = await InterviewEngine.generateQuestion(profile, initialState, []);

    const interview = new Interview({
      userId,
      candidateProfile: profile,
      interviewState: initialState,
      previousQuestions: [firstQ.question],
      turns: [
        {
          stage: initialState.currentStage,
          topic: firstQ.topic,
          difficulty: initialState.difficulty,
          question: firstQ.question,
          candidateAnswer: "",
          timestamp: new Date(),
        },
      ],
      status: "in_progress",
    });

    await interview.save();

    res.status(200).json({
      message: "Interview started successfully.",
      interviewId: interview._id,
      firstQuestion: firstQ.question,
      stage: initialState.currentStage,
      difficulty: initialState.difficulty,
      candidateProfile: profile,
    });
  } catch (error: any) {
    console.error("[Start Interview Error]:", error);
    res.status(500).json({ error: "Failed to initialize interview session." });
  }
};

export const startInterviewSession = startInterview;

export const processCandidateResponse = async (
  req: AuthenticatedRequest,
  res: Response
): Promise => {
  try {
    const { interviewId, candidateText } = req.body;

    if (!interviewId || !mongoose.Types.ObjectId.isValid(interviewId)) {
      res.status(400).json({ error: "Valid interviewId is required." });
      return;
    }

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      res.status(404).json({ error: "Active interview session not found." });
      return;
    }

    let spokenText = candidateText || "";

    if (req.file) {
      const audioResult = await processCandidateAudio(req.file.path);
      if (!spokenText) spokenText = audioResult.text;
    }

    if (
      !spokenText ||
      spokenText.trim().length < 3 ||
      /^\(inaudible\)$/i.test(spokenText.trim())
    ) {
      const currentTurn = interview.turns[interview.turns.length - 1];
      const currentStageIndex =
        STAGE_ORDER.indexOf(interview.interviewState.currentStage) + 1;

      res.status(200).json({
        message: "Audio inaudible, requesting clarification.",
        candidateSpokenText: "(inaudible)",
        aiResponseText:
          "I didn't quite catch that. Could you please repeat or elaborate on your answer?",
        currentQuestionIndex: Math.min(currentStageIndex, STAGE_ORDER.length),
        totalQuestions: STAGE_ORDER.length,
        currentStage: interview.interviewState.currentStage,
        difficulty: interview.interviewState.difficulty,
        isCompleted: false,
      });
      return;
    }

    if (
      interview.status === "completed" ||
      InterviewStateMachine.isComplete(interview.interviewState)
    ) {
      res.status(200).json({
        message: "Interview is already complete.",
        candidateSpokenText: spokenText,
        aiResponseText:
          "The interview has concluded. Please click 'View Scorecard' to view your evaluation.",
        currentQuestionIndex: STAGE_ORDER.length,
        totalQuestions: STAGE_ORDER.length,
        isCompleted: true,
      });
      return;
    }

    // Step A: Record candidate's answer to the previous turn
    const currentTurn = interview.turns[interview.turns.length - 1];
    currentTurn.candidateAnswer = spokenText;

    // Evaluate answer with local model
    const { evaluation, weightedScore } = await InterviewEngine.evaluateAnswer(
      currentTurn.question,
      spokenText,
      currentTurn.topic,
      currentTurn.difficulty
    );

    currentTurn.evaluation = evaluation;
    currentTurn.weightedScore = weightedScore;

    // Step B: Adjust Difficulty (1 to 10) based on answer quality
    interview.interviewState = DifficultyEngine.adjustDifficulty(
      interview.interviewState,
      weightedScore,
      currentTurn.topic
    );

    const refusedTopics: string[] = [];
    interview.turns.forEach((t) => {
      if (
        /never use|never used|don't use|dont use|do not use|no experience|don't know|dont know|do not know|never worked/i.test(
          t.candidateAnswer || ""
        ) &&
        t.topic
      ) {
        refusedTopics.push(t.topic);
      }
    });

    interview.interviewState = InterviewStateMachine.advance(
      interview.interviewState,
      interview.candidateProfile,
      refusedTopics
    );

    let aiNextText = "";
    let isCompleted = false;

    if (InterviewStateMachine.isComplete(interview.interviewState)) {
      isCompleted = true;
      interview.status = "completed";
      aiNextText =
        "Thank you for completing all technical sections of the interview! Please click 'View Scorecard' to see your complete evaluation.";
    } else {
      const nextQ = await InterviewEngine.generateQuestion(
        interview.candidateProfile,
        interview.interviewState,
        interview.previousQuestions,
        interview.turns
      );

      aiNextText = nextQ.question;
      interview.previousQuestions.push(nextQ.question);
      interview.turns.push({
        stage: interview.interviewState.currentStage,
        topic: nextQ.topic,
        difficulty: interview.interviewState.difficulty,
        question: nextQ.question,
        candidateAnswer: "",
        timestamp: new Date(),
      });
    }

    interview.markModified("interviewState");
    interview.markModified("turns");
    await interview.save();

    const currentStageIndex = STAGE_ORDER.indexOf(interview.interviewState.currentStage) + 1;
    res.status(200).json({
      message: "Answer processed successfully.",
      candidateSpokenText: spokenText,
      aiResponseText: aiNextText,
      currentQuestionIndex: Math.min(currentStageIndex, STAGE_ORDER.length),
      totalQuestions: STAGE_ORDER.length,
      currentStage: interview.interviewState.currentStage,
      difficulty: interview.interviewState.difficulty,
      isCompleted,
    });
  } catch (error: any) {
    console.error("[Interview Response Error]:", error);
    res.status(500).json({ error: "Failed to process candidate response." });
  }
};

// Helper to compute calibrated level dynamically from final difficulty and score
const resolveCalibratedLevel = (difficulty: number, overallScore: number): string => {
  if (difficulty >= 8 && overallScore >= 70) return "Senior";
  if (difficulty >= 5 && overallScore >= 50) return "Mid-Level";
  if (difficulty >= 3 && overallScore >= 30) return "Junior";
  return "Entry-Level";
};

export const evaluateInterview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise => {
  try {
    const { interviewId } = req.body;

    if (!interviewId || !mongoose.Types.ObjectId.isValid(interviewId)) {
      res.status(400).json({ error: "Valid interviewId is required." });
      return;
    }

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      res.status(404).json({ error: "Interview session not found." });
      return;
    }

    const totalExpectedStages = STAGE_ORDER.length || 8;
    const evaluatedTurns = interview.turns.filter((t) => t.evaluation);
    const diffNum = interview.interviewState?.difficulty ?? 5;

    if (evaluatedTurns.length === 0) {
      interview.finalScore = {
        technicalScore: 0,
        problemSolvingScore: 0,
        communicationScore: 0,
        confidenceScore: 0,
        depthScore: 0,
        overallScore: 0,
      };
      interview.finalFeedback = {
        strengths: ["Candidate entered session."],
        weaknesses: ["Session abandoned before answering technical questions."],
        recommendations: ["Complete full interview questions to receive calibrated scoring."],
        summary: "Candidate completed 0 of " + totalExpectedStages + " stages (0% finished) with an overall score of 0/100.",
        hiringRecommendation: "Needs Review",
      };
    } else {
      const completionRatio = Math.min(evaluatedTurns.length / totalExpectedStages, 1.0);
      const percent = Math.round(completionRatio * 100);
      let sumTech = 0;
      let sumProb = 0;
      let sumComm = 0;
      let sumConf = 0;
      let sumDepth = 0;
      const rawStrengths: string[] = [];
      const rawWeaknesses: string[] = [];

      evaluatedTurns.forEach((t) => {
        const e = t.evaluation!;
        sumTech += e.technicalAccuracy;
        sumProb += e.problemSolving;
        sumComm += e.communication;
        sumConf += e.confidence;
        sumDepth += e.depth;
        (e.strengths || []).forEach((s: string) => {
          if (s && s.toLowerCase().trim() !== "string" && s.trim().length > 3) rawStrengths.push(s.trim());
        });
        (e.weaknesses || []).forEach((w: string) => {
          if (w && w.toLowerCase().trim() !== "string" && w.trim().length > 3) rawWeaknesses.push(w.trim());
        });
      });

      const count = evaluatedTurns.length;
      const techAvg = Math.round((sumTech / count) * completionRatio);
      const probAvg = Math.round((sumProb / count) * completionRatio);
      const commAvg = Math.round((sumComm / count) * completionRatio);
      const confAvg = Math.round((sumConf / count) * completionRatio);
      const depthAvg = Math.round((sumDepth / count) * completionRatio);
      const overall = Math.round(techAvg * 0.4 + probAvg * 0.2 + commAvg * 0.2 + confAvg * 0.1 + depthAvg * 0.1);

      interview.finalScore = {
        technicalScore: techAvg,
        problemSolvingScore: probAvg,
        communicationScore: commAvg,
        confidenceScore: confAvg,
        depthScore: depthAvg,
        overallScore: overall,
      };

      const weakTopic =
        interview.interviewState?.weakAreas?.filter((w: string) => w.toLowerCase() !== "string").join(", ") ||
        "core engineering principles";
      interview.finalFeedback = {
        strengths: rawStrengths.length > 0 ? Array.from(new Set(rawStrengths)).slice(0, 4) : ["Attempted technical explanations."],
        weaknesses: [
          ...(percent < 100 ? ["Interview completed " + percent + "% of stages."] : []),
          ...Array.from(new Set(rawWeaknesses)).slice(0, 3),
        ],
        recommendations: [
          "Strengthen core concepts in " + weakTopic + ".",
          "Review production considerations, syntax precision, and edge cases.",
        ],
        summary: "Candidate completed " + evaluatedTurns.length + " of " + totalExpectedStages + " stages (" + percent + "% finished) with an overall score of " + overall + "/100.",
        hiringRecommendation: overall >= 75 ? "Strong Hire" : overall >= 55 ? "Hire" : "Needs Review",
      };
    }

    interview.status = "completed";
    await interview.save();

    const overallScore = interview.finalScore.overallScore;
    const calibratedLevel = resolveCalibratedLevel(diffNum, overallScore);
    const formattedDifficulty = diffNum + "/10 (" + calibratedLevel + ")";

    res.status(200).json({
      scores: {
        ...interview.finalScore,
        behaviorScore: interview.finalScore.depthScore,
      },
      feedback: interview.finalFeedback,
      difficulty: formattedDifficulty,
    });
  } catch (error: any) {
    console.error("[Evaluate Interview Error]:", error);
    res.status(500).json({ error: "Failed to evaluate interview." });
  }
};

export const completeAndEvaluateInterview = evaluateInterview;