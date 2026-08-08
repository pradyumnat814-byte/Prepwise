import { Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middleware/auth";
import { Resume } from "../models/Resume";
import { GitHubProfile } from "../models/GitHubProfile";
import { Interview } from "../models/Interview";
import {
  generateInitialQuestions,
  generateFollowUpQuestion,
  evaluateInterviewTranscript,
} from "../services/ai/aiService";
import { processCandidateAudio } from "../services/voice/voiceService";

// 1. START A NEW INTERVIEW SESSION
export const startInterviewSession = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    const latestResume = await Resume.findOne({ userId }).sort({ createdAt: -1 });
    if (!latestResume) {
      res.status(400).json({ error: "No uploaded resume found. Please upload a resume first." });
      return;
    }

    const githubProfile = await GitHubProfile.findOne({ userId });
    if (!githubProfile) {
      res.status(400).json({ error: "GitHub profile analysis missing. Please re-run candidate analysis." });
      return;
    }

    const difficulty = githubProfile.estimatedLevel || "Intermediate";

    // Generate initial set of tailored topic questions
    const questions = await generateInitialQuestions(
      latestResume.rawText,
      latestResume.parsedData.skills,
      githubProfile,
      difficulty
    );

    // Save questions array and initial question to MongoDB
    const interview = await Interview.create({
      userId,
      resumeId: latestResume._id,
      githubProfileId: githubProfile._id,
      status: "in-progress",
      difficulty,
      currentQuestionIndex: 0,
      followUpCount: 0,
      questions,
      transcript: [
        {
          speaker: "ai",
          text: questions[0]?.question || "Hello! Ready to begin your interview?",
          timestamp: new Date(),
        },
      ],
    });

    res.status(201).json({
      message: "Interview session created successfully!",
      interviewId: interview._id,
      difficulty: interview.difficulty,
      initialQuestion: questions[0]?.question,
      totalQuestions: questions.length,
    });
  } catch (error: any) {
    console.error("[Interview Start Controller Error]:", error);
    res.status(500).json({ error: "Failed to initialize AI interview session." });
  }
};


// 2. PROCESS CANDIDATE RESPONSE & ADVANCE OR FOLLOW-UP
export const processCandidateResponse = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { interviewId, candidateText } = req.body;

    if (!interviewId || !mongoose.Types.ObjectId.isValid(interviewId)) {
      res.status(400).json({ error: "Valid interviewId is required." });
      return;
    }

    const interview = await Interview.findOne({
      _id: new mongoose.Types.ObjectId(interviewId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!interview) {
      res.status(404).json({ error: "Active interview session not found." });
      return;
    }

    let spokenText = candidateText || "";

    if (req.file) {
      const audioResult = await processCandidateAudio(req.file.path);
      if (!spokenText) spokenText = audioResult.text;
    }

    if (!spokenText || spokenText.trim().length === 0) {
      res.status(400).json({ error: "No candidate speech or text response provided." });
      return;
    }

    // 🔴 COMPLETION GUARD: If interview is already completed or at max questions, lock further follow-ups
    if (
      interview.status === "completed" ||
      interview.currentQuestionIndex >= interview.questions.length
    ) {
      const wrapUpMsg =
        "The interview has concluded. Please click 'Finish & Score' to generate your scorecard.";

      res.status(200).json({
        message: "Interview is already complete.",
        candidateSpokenText: spokenText,
        aiResponseText: wrapUpMsg,
        currentQuestionIndex: interview.questions.length,
        totalQuestions: interview.questions.length,
        isCompleted: true,
      });
      return;
    }

    // Push candidate response into conversation transcript
    interview.transcript.push({
      speaker: "candidate",
      text: spokenText,
      timestamp: new Date(),
    });

    let aiNextText = "";
    let isCompletedNow = false;

    // STATE MACHINE ORCHESTRATION
    if (interview.followUpCount < 1) {
      // 1 Dynamic Follow-up
      const history = interview.transcript.map((t) => ({ speaker: t.speaker, text: t.text }));
      aiNextText = await generateFollowUpQuestion(history, spokenText, interview.difficulty);
      interview.followUpCount += 1;
    } else {
      // Advance to next main topic
      interview.currentQuestionIndex += 1;
      interview.followUpCount = 0;

      if (interview.currentQuestionIndex < interview.questions.length) {
        const nextQ = interview.questions[interview.currentQuestionIndex];
        aiNextText = `Thank you. Moving on to topic ${interview.currentQuestionIndex + 1}: ${nextQ.question}`;
      } else {
        // All topics complete!
        isCompletedNow = true;
        aiNextText =
          "Thank you so much for answering all the technical questions! That concludes our interview. Please click 'Finish & Score' to view your scorecard.";
      }
    }

    interview.transcript.push({
      speaker: "ai",
      text: aiNextText,
      timestamp: new Date(),
    });

    await interview.save();

    res.status(200).json({
      message: "Response processed successfully.",
      candidateSpokenText: spokenText,
      aiResponseText: aiNextText,
      currentQuestionIndex: Math.min(
        interview.currentQuestionIndex + 1,
        interview.questions.length
      ),
      totalQuestions: interview.questions.length,
      isCompleted: isCompletedNow || interview.currentQuestionIndex >= interview.questions.length,
    });
  } catch (error: any) {
    console.error("[Interview Response Controller Error]:", error);
    res.status(500).json({ error: "Failed to process candidate response." });
  }
};

// 3. COMPLETE INTERVIEW & GENERATE AI SCORECARD
export const completeAndEvaluateInterview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { interviewId } = req.body;

    if (!interviewId || !mongoose.Types.ObjectId.isValid(interviewId)) {
      res.status(400).json({ error: "Valid interviewId is required." });
      return;
    }

    const interview = await Interview.findOne({
      _id: new mongoose.Types.ObjectId(interviewId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!interview) {
      res.status(404).json({ error: "Active interview session not found." });
      return;
    }

    const resume = await Resume.findById(interview.resumeId);
    const skills = resume?.parsedData.skills || [];

    const formattedTranscript = interview.transcript.map((t) => ({
      speaker: t.speaker,
      text: t.text,
    }));

    // Step 1: Run AI Transcript Evaluation Engine
    const evaluation = await evaluateInterviewTranscript(
      formattedTranscript,
      interview.difficulty,
      skills
    );

    // Step 2: Update Interview document in MongoDB
    interview.status = "completed";
    interview.scores = evaluation.scores;
    interview.feedback = {
      strengths: evaluation.feedback.strengths,
      weaknesses: evaluation.feedback.weaknesses,
      recommendations: evaluation.feedback.recommendations,
      summary: evaluation.feedback.summary,
    };

    await interview.save();

    res.status(200).json({
      message: "Interview completed and evaluated successfully!",
      interviewId: interview._id,
      status: interview.status,
      difficulty: interview.difficulty,
      scores: interview.scores,
      feedback: evaluation.feedback,
    });
  } catch (error: any) {
    console.error("[Evaluation Controller Error]:", error);
    res.status(500).json({ error: "Failed to generate interview evaluation." });
  }
};