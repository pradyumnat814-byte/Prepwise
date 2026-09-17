import {
  InterviewStage,
  IInterviewState,
  ExperienceLevel,
  ICandidateProfile,
} from "../../types/candidateProfile.types";

export const STAGE_ORDER: InterviewStage[] = [
  "introduction",
  "resume",
  "github",
  "technical",
  "project",
  "problem_solving",
  "behavioral",
  "final",
];

export class InterviewStateMachine {
  public static initializeState(
    candidateLevel: ExperienceLevel,
    initialDifficulty: number = 5
  ): IInterviewState {
    return {
      candidateLevel,
      difficulty: Math.min(10, Math.max(1, initialDifficulty)),
      currentStage: "introduction",
      currentTopic: "Introduction & Background",
      stageStep: 0,
      topicsCovered: [],
      strongAreas: [],
      weakAreas: [],
      recentAnswerQuality: 75,
      remainingStages: STAGE_ORDER.slice(1),
    };
  }

  public static advance(
    state: IInterviewState,
    profile: ICandidateProfile,
    excludedTopics: string[] = []
  ): IInterviewState {
    const currentIndex = STAGE_ORDER.indexOf(state.currentStage);
    const covered = [...(state.topicsCovered || [])];

    if (state.currentTopic && !covered.includes(state.currentTopic)) {
      covered.push(state.currentTopic);
    }

    // Advance to 'final' stage at the end of the order
    if (currentIndex >= STAGE_ORDER.length - 2) {
      return {
        ...state,
        currentStage: "final",
        currentTopic: "Interview Wrap-up",
        topicsCovered: covered,
        remainingStages: [],
      };
    }

    const nextStage = STAGE_ORDER[currentIndex + 1];
    const nextTopic = this.resolveTopicForStage(nextStage, profile, covered, excludedTopics);

    return {
      ...state,
      currentStage: nextStage,
      currentTopic: nextTopic,
      stageStep: 0,
      topicsCovered: covered,
      remainingStages: STAGE_ORDER.slice(currentIndex + 2),
    };
  }

  private static resolveTopicForStage(
    stage: InterviewStage,
    profile: ICandidateProfile,
    covered: string[],
    excluded: string[] = []
  ): string {
    const normalizedExcluded = new Set(excluded.map((e) => e.toLowerCase()));
    const skills = profile.skills || ["Node.js", "JavaScript", "React", "MongoDB"];
    const availableSkills = skills.filter(
      (s) => !covered.includes(s) && !normalizedExcluded.has(s.toLowerCase())
    );

    const fallbackSkill =
      availableSkills[0] ||
      skills.find((s) => !normalizedExcluded.has(s.toLowerCase())) ||
      "Backend Architecture";

    switch (stage) {
      case "resume":
        return fallbackSkill;
      case "github": {
        const repoName = (profile as any)?.github?.topRepositories?.[0]?.name;
        return repoName
          ? `Repository Architecture (${repoName})`
          : "Code Organization & Version Control";
      }
      case "technical":
        return availableSkills[1] || availableSkills[0] || "Database Indexing & Async Mechanics";
      case "project":
        return "Production Deployment & Failure Handling";
      case "problem_solving":
        return "Concurrency, Bottlenecks & Edge Cases";
      case "behavioral":
        return "Engineering Trade-offs & Cross-team Conflict";
      default:
        return "Technical Summary";
    }
  }

  public static isComplete(state: IInterviewState): boolean {
    return state.currentStage === "final";
  }
}