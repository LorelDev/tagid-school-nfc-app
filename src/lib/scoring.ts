import type { Mission } from "@/lib/types";

export interface ScoreResult {
  isCorrect: boolean;
  points: number;
  needsApproval: boolean;
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

// Auto-score a submitted answer against a mission.
export function scoreAnswer(mission: Mission, answer: string): ScoreResult {
  const correct = mission.correct_answer ?? "";
  const approval = mission.requires_teacher_approval;

  // Reflection / knowledge collection: always accepted (no single correct answer).
  if (
    mission.mission_type === "group_reflection" ||
    mission.mission_type === "knowledge_piece" ||
    (mission.mission_type === "open_text" && !correct) ||
    (mission.mission_type === "rating" && !correct)
  ) {
    return {
      isCorrect: true,
      points: approval ? 0 : mission.points,
      needsApproval: approval,
    };
  }

  // Otherwise compare to the reference answer.
  const ok = norm(answer) === norm(correct);
  return {
    isCorrect: ok,
    points: ok && !approval ? mission.points : 0,
    needsApproval: approval,
  };
}
