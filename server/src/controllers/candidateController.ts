import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { parseResumePDF } from "../services/resume/resumeParser";
import { fetchGitHubData } from "../services/github/githubService";
import { Resume } from "../models/Resume";
import { GitHubProfile } from "../models/GitHubProfile";
import { User } from "../models/User";

export const uploadAndAnalyzeCandidate = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!req.file) {
      res.status(400).json({ error: "Please upload a valid PDF resume file." });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User profile not found." });
      return;
    }

    // Step 1: Parse uploaded PDF Resume
    const parsedResumeData = await parseResumePDF(req.file.path);

    // Save Resume to MongoDB
    const savedResume = await Resume.create({
      userId,
      filePath: req.file.path,
      rawText: parsedResumeData.rawText,
      parsedData: {
        skills: parsedResumeData.extractedSkills,
        education: parsedResumeData.educationKeywords,
        experience: [],
        projects: [],
      },
    });

    // Step 2: Fetch and analyze GitHub profile
    const githubData = await fetchGitHubData(user.githubUrl);

    // Save or update GitHub Profile in MongoDB
    const savedGitHubProfile = await GitHubProfile.findOneAndUpdate(
      { userId },
      {
        userId,
        username: githubData.username,
        publicRepos: githubData.publicRepos,
        followers: githubData.followers,
        repositories: githubData.topRepositories,
        estimatedLevel: githubData.estimatedLevel,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      message: "Resume uploaded and GitHub profile analyzed successfully!",
      resume: {
        id: savedResume._id,
        extractedSkills: savedResume.parsedData.skills,
      },
      githubProfile: {
        username: savedGitHubProfile.username,
        publicRepos: savedGitHubProfile.publicRepos,
        estimatedLevel: savedGitHubProfile.estimatedLevel,
        primaryLanguages: githubData.primaryLanguages,
      },
    });
  } catch (error: any) {
    console.error("[Candidate Controller Error]:", error);
    res.status(500).json({ error: error.message || "Failed to analyze candidate profile." });
  }
};