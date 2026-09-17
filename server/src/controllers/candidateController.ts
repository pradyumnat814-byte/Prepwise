import { Response } from "express";
import fs from "fs";
import pdfParse from "pdf-parse";
import { User } from "../models/User";
import { CandidateProfileService } from "../services/candidate/candidateProfileService";
import { saveScrapedDataDebug } from "../utils/debugDumper";
import { AuthenticatedRequest } from "../middleware/auth";

const COMMON_SKILLS = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust",
  "Node.js", "Express", "React", "Next.js", "Vue", "Angular",
  "MongoDB", "PostgreSQL", "MySQL", "Redis", "SQLite",
  "Docker", "Kubernetes", "AWS", "GCP", "Azure", "CI/CD", "Git",
  "GraphQL", "REST", "TailwindCSS", "Redux", "Linux", "System Design"
];

const extractSkillsFromText = (text: string): string[] => {
  const normalizedText = text.toLowerCase();
  const matched = new Set();

  for (const skill of COMMON_SKILLS) {
    const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(normalizedText)) {
      matched.add(skill);
    }
  }

  return Array.from(matched);
};

const sanitizeGithubUsername = (input?: string): string => {
  if (!input) return "";
  const cleaned = input.trim().replace(/^@/, "");
  const match = cleaned.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9-_]+)/i);
  return match ? match[1] : cleaned;
};

export const analyzeCandidate = async (
  req: AuthenticatedRequest,
  res: Response
): Promise => {
  let resumeRawText = "";
  let extractedCandidateName = "Candidate";

  try {
    const { githubUsername: rawGithubInput, name } = req.body;
    const userId = req.userId;

    if (name && typeof name === "string" && name.trim().length > 0) {
      extractedCandidateName = name.trim();
    }

    // 1. Fetch GitHub handle and name from registered User document if available
    let targetGithubUser = sanitizeGithubUsername(rawGithubInput);

    if (userId) {
      try {
        const user = await User.findById(userId);
        if (user) {
          const storedGithub =
            (user as any).githubUrl ||
            (user as any).githubUsername ||
            (user as any).github;

          if (!targetGithubUser && storedGithub) {
            targetGithubUser = sanitizeGithubUsername(storedGithub);
          }

          if (extractedCandidateName === "Candidate" && user.name) {
            extractedCandidateName = user.name;
          }
        }
      } catch (userErr) {
        console.warn("[CandidateController]: Failed to load user from database:", userErr);
      }
    }

    // 2. Parse Uploaded Resume (PDF)
    if (req.file) {
      const filePath = req.file.path;
      try {
        const fileBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(fileBuffer);
        resumeRawText = pdfData.text || "";

        if (extractedCandidateName === "Candidate" && resumeRawText.trim().length > 0) {
          const firstLine = resumeRawText.trim().split("\n")[0].trim();
          if (firstLine.length > 2 && firstLine.length < 35 && !/[0-9]/.test(firstLine)) {
            extractedCandidateName = firstLine;
          }
        }

        // Fallback: If GitHub handle is still missing, scan resume text for github.com links
        if (!targetGithubUser && resumeRawText) {
          const resumeMatch = resumeRawText.match(
            /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9-_]+)/i
          );
          if (resumeMatch && resumeMatch[1]) {
            const ignoredKeywords = ["topics", "features", "marketplace", "explore", "pricing", "login", "join"];
            if (!ignoredKeywords.includes(resumeMatch[1].toLowerCase())) {
              targetGithubUser = resumeMatch[1];
            }
          }
        }
      } catch (pdfErr) {
        console.warn("[CandidateController]: PDF text extraction failed:", pdfErr);
      } finally {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    // 3. Scrape GitHub Profile and Top Repositories
    let githubScrapedData: any = {
      username: targetGithubUser || "none",
      public_repos: 0,
      topLanguages: [],
      topRepositories: [],
    };

    if (targetGithubUser) {
      try {
        const userRes = await fetch(`https://api.github.com/users/${targetGithubUser}`, {
          headers: { "User-Agent": "AI-Technical-Interviewer-Scraper" },
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          if (extractedCandidateName === "Candidate" && userData.name) {
            extractedCandidateName = userData.name;
          }

          const reposRes = await fetch(
            `https://api.github.com/users/${targetGithubUser}/repos?sort=updated&per_page=6`,
            { headers: { "User-Agent": "AI-Technical-Interviewer-Scraper" } }
          );

          let reposData: any[] = [];
          if (reposRes.ok) {
            reposData = await reposRes.json();
          }

          const languagesDetected = new Set();
          const formattedRepos = Array.isArray(reposData)
            ? reposData.map((r: any) => {
                if (r.language) languagesDetected.add(r.language);
                return {
                  name: r.name,
                  description: r.description || "No description provided",
                  language: r.language || "Unknown",
                  stars: r.stargazers_count || 0,
                  updatedAt: r.updated_at,
                };
              })
            : [];

          githubScrapedData = {
            username: targetGithubUser,
            name: userData.name,
            bio: userData.bio,
            public_repos: userData.public_repos || 0,
            topLanguages: Array.from(languagesDetected),
            topRepositories: formattedRepos,
          };
        }
      } catch (ghErr) {
        console.warn("[CandidateController]: GitHub scraping failed:", ghErr);
      }
    }

    // 4. Combine Extracted Skills
    const resumeSkills = extractSkillsFromText(resumeRawText);
    const githubSkills = (githubScrapedData.topLanguages || []) as string[];
    const combinedSkills = Array.from(new Set([...resumeSkills, ...githubSkills]));

    const finalSkillsList =
      combinedSkills.length > 0
        ? combinedSkills
        : ["TypeScript", "Node.js", "React", "MongoDB", "SQL"];

    // 5. Build Profile Object
    const experienceLevel =
      resumeRawText.length > 3000 || (githubScrapedData.public_repos || 0) > 15
        ? "senior"
        : resumeRawText.length > 1200 || (githubScrapedData.public_repos || 0) > 5
        ? "intermediate"
        : "junior";

    const candidateProfile = CandidateProfileService.buildProfile(
      extractedCandidateName,
      finalSkillsList,
      {
        public_repos: githubScrapedData.public_repos,
        topLanguages: githubScrapedData.topLanguages,
        topRepositories: githubScrapedData.topRepositories,
      },
      experienceLevel
    );

    // 6. Write Scraped Debug Output to File
    const savedDumpPath = saveScrapedDataDebug({
      source: "combined_profile",
      candidateName: candidateProfile.name,
      githubUsername: targetGithubUser || "not_provided",
      rawExtractedText: resumeRawText.slice(0, 5000),
      scrapedGithubData: githubScrapedData,
      extractedSkills: finalSkillsList,
      fullProfile: candidateProfile,
    });

    res.status(200).json({
      message: "Candidate profile analyzed and generated successfully.",
      debugDumpLocation: savedDumpPath,
      profile: candidateProfile,
    });
  } catch (error: any) {
    console.error("[Candidate Analyze Error]:", error);
    res.status(500).json({ error: "Failed to analyze candidate profile." });
  }
};