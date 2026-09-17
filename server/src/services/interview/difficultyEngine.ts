import { IInterviewState } from "../../types/candidateProfile.types";

export class DifficultyEngine {
  /**
   * Adjusts the difficulty (1 to 10) based on answer quality and updates weak/strong areas
   */
  public static adjustDifficulty(
    state: IInterviewState,
    qualityScore: number, // 0 to 100
    currentTopic: string
  ): IInterviewState {
    const clampedScore = Math.min(100, Math.max(0, qualityScore));
    state.recentAnswerQuality = clampedScore;

    if (clampedScore >= 85) {
      // Excellent response: Increase difficulty
      state.difficulty = Math.min(10, state.difficulty + 1);
      if (currentTopic && !state.strongAreas.includes(currentTopic)) {
        state.strongAreas.push(currentTopic);
      }
    } else if (clampedScore < 60) {
      // Weak response: Decrease difficulty
      state.difficulty = Math.max(1, state.difficulty - 1);
      if (currentTopic && !state.weakAreas.includes(currentTopic)) {
        state.weakAreas.push(currentTopic);
      }
    }
    // 60 - 84 keeps current difficulty unchanged

    return state;
  }
}