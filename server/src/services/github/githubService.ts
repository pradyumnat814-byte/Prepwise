import axios from "axios";

export interface IGitHubAnalysis {
  username: string;
  publicRepos: number;
  followers: number;
  totalStars: number;
  totalForks: number;
  primaryLanguages: string[];
  topRepositories: Array<{
    name: string;
    description: string;
    language: string;
    stars: number;
    forks: number;
  }>;
  estimatedLevel: "Beginner" | "Intermediate" | "Advanced" | "Expert";
}

// Utility to parse username from full URL (e.g., https://github.com/octocat -> octocat)
export const extractGithubUsername = (githubUrl: string): string => {
  const cleaned = githubUrl.trim().replace(/\/$/, "");
  const parts = cleaned.split("/");
  return parts[parts.length - 1];
};

export const fetchGitHubData = async (githubUrl: string): Promise<IGitHubAnalysis> => {
  const username = extractGithubUsername(githubUrl);
  const token = process.env.GITHUB_TOKEN;

  const headers: Record<string, string> = {
    "User-Agent": "AI-Voice-Interviewer-App",
  };
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

  try {
    // 1. Fetch User Profile
    const userResponse = await axios.get(`https://api.github.com/users/${username}`, { headers });
    const userData = userResponse.data;

    // 2. Fetch Public Repositories (up to 100 sorted by updated)
    const reposResponse = await axios.get(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
      { headers }
    );
    const reposData = reposResponse.data;

    let totalStars = 0;
    let totalForks = 0;
    const languagesSet = new Set<string>();

    const repositories = reposData.map((repo: any) => {
      totalStars += repo.stargazers_count || 0;
      totalForks += repo.forks_count || 0;
      if (repo.language) languagesSet.add(repo.language);

      return {
        name: repo.name,
        description: repo.description || "No description provided",
        language: repo.language || "N/A",
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
      };
    });

    // 3. Estimate Developer Level based on metrics
    const publicRepos = userData.public_repos || 0;
    const score = (publicRepos * 2) + (totalStars * 5) + (totalForks * 3) + (languagesSet.size * 4);

    let estimatedLevel: "Beginner" | "Intermediate" | "Advanced" | "Expert" = "Beginner";
    if (score > 120) estimatedLevel = "Expert";
    else if (score > 60) estimatedLevel = "Advanced";
    else if (score > 20) estimatedLevel = "Intermediate";

    return {
      username,
      publicRepos,
      followers: userData.followers || 0,
      totalStars,
      totalForks,
      primaryLanguages: Array.from(languagesSet),
      topRepositories: repositories.slice(0, 5), // Keep top 5 repos for context window optimization
      estimatedLevel,
    };
  } catch (error: any) {
    console.error("[GitHub Service Error]: Failed to fetch profile", error.message);
    throw new Error(`Failed to fetch GitHub profile for ${username}. Verify the URL.`);
  }
};