import { ICandidateProfile, ExperienceLevel, IGithubMetrics } from "../../types/candidateProfile.types";

export class CandidateProfileService {
  /**
   * Builds a normalized, compact candidate profile from raw resume text and GitHub metrics.
   */
  public static buildProfile(
    candidateName: string,
    extractedSkills: string[],
    rawGithubData: any,
    estimatedLevel?: ExperienceLevel
  ): ICandidateProfile {
    // 1. Determine experience level from skills count & GitHub activity if not provided
    const repoCount = rawGithubData?.public_repos || 0;
    let level: ExperienceLevel = estimatedLevel || "intermediate";

    if (!estimatedLevel) {
      if (repoCount > 25 || extractedSkills.length > 12) {
        level = "advanced";
      } else if (repoCount < 5 && extractedSkills.length < 5) {
        level = "beginner";
      }
    }

    // 2. Format GitHub metrics
    const github: IGithubMetrics = {
      username: rawGithubData?.login || "anonymous",
      publicRepoCount: repoCount,
      primaryLanguages: Array.isArray(rawGithubData?.topLanguages) ? rawGithubData.topLanguages : [],
      topRepositories: Array.isArray(rawGithubData?.repositories)
        ? rawGithubData.repositories.slice(0, 5).map((r: any) => ({
            name: r.name,
            description: r.description || null,
            language: r.language || null,
            stars: r.stargazers_count || 0,
          }))
        : [],
    };

    // 3. Return normalized object
    return {
      name: candidateName || "Candidate",
      experienceLevel: level,
      skills: Array.from(new Set(extractedSkills)),
      projects: [],
      education: [],
      github,
    };
  }
}