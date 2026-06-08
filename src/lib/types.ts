// Shared domain types for תגיד (Tagid).

export type Role = "super_admin" | "school_admin" | "teacher" | "student";

export type TagStatus = "unassigned" | "assigned" | "disabled";

export type ActivityMode =
  | "station_race"
  | "treasure_hunt"
  | "social"
  | "active_lesson"
  | "escape_room"
  | "hackathon";

export type ActivityStatus = "draft" | "published" | "archived";

export type UnlockType = "open" | "dependency";

export type MissionType =
  | "multiple_choice"
  | "open_text"
  | "yes_no"
  | "rating"
  | "group_reflection"
  | "final_answer"
  | "knowledge_piece";

export type SessionStatus = "draft" | "active" | "paused" | "completed";

export type ProgressStatus = "locked" | "unlocked" | "in_progress" | "completed";

export interface School {
  id: string;
  name: string;
  city: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  school_id: string | null;
  full_name: string | null;
  email: string | null;
  role: Role;
  created_at: string;
}

export interface ClassRow {
  id: string;
  school_id: string;
  name: string;
  grade: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  school_id: string;
  tag_code: string;
  physical_label: string | null;
  location_name: string | null;
  location_description: string | null;
  status: TagStatus;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  school_id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  grade_level: string | null;
  subject: string | null;
  mode: ActivityMode;
  status: ActivityStatus;
  estimated_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface Station {
  id: string;
  activity_id: string;
  tag_id: string | null;
  title: string;
  location_hint: string | null;
  order_index: number;
  unlock_type: UnlockType;
  depends_on_station_id: string | null;
  points: number;
  created_at: string;
}

export interface Mission {
  id: string;
  station_id: string;
  mission_type: MissionType;
  prompt: string;
  helper_text: string | null;
  answer_options: string[] | null;
  correct_answer: string | null;
  requires_teacher_approval: boolean;
  points: number;
  knowledge_piece: string | null;
  order_index: number;
  created_at: string;
}

export interface Session {
  id: string;
  activity_id: string;
  school_id: string;
  teacher_id: string | null;
  class_id: string | null;
  session_code: string;
  status: SessionStatus;
  started_at: string | null;
  paused_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  session_id: string;
  name: string;
  color: string;
  score: number;
  created_at: string;
}

export interface Participant {
  id: string;
  session_id: string;
  group_id: string | null;
  display_name: string;
  device_fingerprint: string | null;
  joined_at: string;
  last_seen_at: string;
}

export interface StationProgress {
  id: string;
  session_id: string;
  group_id: string;
  station_id: string;
  status: ProgressStatus;
  unlocked_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  completed_by_participant_id: string | null;
}

export interface ResponseRow {
  id: string;
  session_id: string;
  group_id: string;
  participant_id: string | null;
  station_id: string;
  mission_id: string;
  answer_text: string | null;
  answer_json: unknown;
  is_correct: boolean;
  points_awarded: number;
  teacher_approved: boolean | null;
  created_at: string;
}

export interface EventRow {
  id: string;
  session_id: string;
  group_id: string | null;
  participant_id: string | null;
  tag_id: string | null;
  station_id: string | null;
  event_type: string;
  event_payload: unknown;
  created_at: string;
}

// ---- UI label maps (Hebrew) ----
export const ACTIVITY_MODE_LABELS: Record<ActivityMode, string> = {
  station_race: "מרוץ תחנות",
  treasure_hunt: "חפש את המטמון",
  social: "פעילות חברתית",
  active_lesson: "שיעור פעיל",
  escape_room: "חדר בריחה",
  hackathon: "האקתון / יזמות",
};

export const MISSION_TYPE_LABELS: Record<MissionType, string> = {
  multiple_choice: "בחירה מרובה",
  open_text: "טקסט פתוח",
  yes_no: "כן / לא",
  rating: "דירוג",
  group_reflection: "רפלקציה קבוצתית",
  final_answer: "תשובת סיום",
  knowledge_piece: "פיסת ידע",
};

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  draft: "טיוטה",
  active: "פעילה",
  paused: "מושהית",
  completed: "הסתיימה",
};

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  draft: "טיוטה",
  published: "פורסמה",
  archived: "בארכיון",
};
