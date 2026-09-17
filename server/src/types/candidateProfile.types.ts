export type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "expert";

export type InterviewStage =
  | "introduction"
  | "resume"
  | "github"
  | "technical"
  | "project"
  | "problem_solving"
  | "behavioral"
  | "final";

export interface IProjectSummary {
  name: string;
  description?: string;
  technologies: string[];
}

export interface IEducationSummary {
  degree?: string;
  institution?: string;
  year?: string;
}

export interface IGithubMetrics {
  username: string;
  publicRepoCount: number;
  primaryLanguages: string[];
  topRepositories: Array<{
    name: string;
    description: string | null;
    language: string | null;
    stars: number;
  }>;
}

// Compact, normalized candidate profile used across the engine
export interface ICandidateProfile {
  name: string;
  experienceLevel: ExperienceLevel;
  skills: string[];
  projects: IProjectSummary[];
  education: IEducationSummary[];
  github: IGithubMetrics;
}

// Structured state machine data stored in MongoDB and tracked in real-time
export interface IInterviewState {
  candidateLevel: ExperienceLevel;
  difficulty: number; // Scale 1 to 10
  currentStage: InterviewStage;
  currentTopic: string;
  stageStep: number; // e.g. question index within current stage
  topicsCovered: string[];
  strongAreas: string[];
  weakAreas: string[];
  recentAnswerQuality: number; // 0 to 100
  remainingStages: InterviewStage[];
}