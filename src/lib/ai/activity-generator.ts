// AI activity generator — PLACEHOLDER.
//
// This module is structured so it can later connect to OpenAI / Gemini / Claude.
// Today it returns a deterministic mocked activity so the UI and data flow work
// end-to-end. To make it real, implement `callLLM` and parse its JSON output
// into the same `GeneratedActivity` shape.

import type { ActivityMode, MissionType } from "@/lib/types";

export interface GeneratedMission {
  mission_type: MissionType;
  prompt: string;
  answer_options?: string[];
  correct_answer?: string;
  points: number;
  knowledge_piece?: string;
}

export interface GeneratedStation {
  title: string;
  location_hint?: string;
  points: number;
  missions: GeneratedMission[];
}

export interface GeneratedActivity {
  title: string;
  description: string;
  mode: ActivityMode;
  stations: GeneratedStation[];
}

// Future: break a syllabus/topic into concepts -> dependencies -> stations ->
// missions -> collaboration flow -> final challenge.
export function generateActivityFromTopic(topic: string): GeneratedActivity {
  return {
    title: `מסע למידה: ${topic}`,
    description: `פעילות תחנות שנבנתה אוטומטית סביב הנושא "${topic}".`,
    mode: "station_race",
    stations: [
      {
        title: "פתיחה",
        location_hint: "כניסה",
        points: 10,
        missions: [
          {
            mission_type: "open_text",
            prompt: `מה אתם כבר יודעים על ${topic}?`,
            points: 10,
          },
        ],
      },
      {
        title: "העמקה",
        location_hint: "ספרייה",
        points: 15,
        missions: [
          {
            mission_type: "multiple_choice",
            prompt: `איזה היגד מתאר נכון את ${topic}?`,
            answer_options: ["היגד א", "היגד ב", "היגד ג"],
            correct_answer: "היגד א",
            points: 15,
          },
        ],
      },
      {
        title: "סיכום",
        location_hint: "תחנת סיום",
        points: 20,
        missions: [
          {
            mission_type: "final_answer",
            prompt: `נסחו במשפט אחד מה למדתם על ${topic}.`,
            points: 20,
          },
        ],
      },
    ],
  };
}

// Stubs for future AI features (kept here so call sites already exist).
export async function suggestMissions(_stationTitle: string): Promise<GeneratedMission[]> {
  return [];
}
export async function summarizeReflections(_answers: string[]): Promise<string> {
  return "סיכום רפלקציות יתווסף כשתחובר יכולת ה-AI.";
}
