// Shared domain types for Tagid.

export type Role = "teacher" | "student";

export type MissionType = "single_choice" | "multi_choice" | "text" | "number";

export interface Profile {
  id: string;
  full_name: string | null;
  role: Role;
  created_at: string;
}

export interface Activity {
  id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  created_at: string;
}

export interface Mission {
  id: string;
  activity_id: string;
  position: number;
  title: string;
  prompt: string;
  type: MissionType;
  options: string[] | null; // for choice types
  answer: string | null; // correct answer (csv for multi)
  points: number;
}

export interface NfcTag {
  id: string;
  teacher_id: string;
  code: string; // short code embedded in the tag URL
  label: string | null;
  mission_id: string | null; // tag is bound to this mission
  created_at: string;
}

export type SessionStatus = "draft" | "live" | "ended";

export interface Session {
  id: string;
  activity_id: string;
  teacher_id: string;
  join_code: string;
  status: SessionStatus;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface Participant {
  id: string;
  session_id: string;
  display_name: string;
  score: number;
  joined_at: string;
}

export interface Submission {
  id: string;
  session_id: string;
  participant_id: string;
  mission_id: string;
  answer: string;
  is_correct: boolean;
  points_awarded: number;
  created_at: string;
}
