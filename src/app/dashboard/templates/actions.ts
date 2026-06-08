"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { ActivityMode, MissionType } from "@/lib/types";

type TemplateStation = {
  title: string;
  location_hint?: string;
  points?: number;
  missions?: {
    mission_type: MissionType;
    prompt: string;
    answer_options?: string[];
    correct_answer?: string;
    points?: number;
    knowledge_piece?: string;
  }[];
};
type TemplateJson = { stations?: TemplateStation[] };

export async function createFromTemplate(formData: FormData) {
  const profile = await requireProfile();
  const supabase = createClient();
  const templateId = String(formData.get("id"));

  const { data: tpl } = await supabase
    .from("activity_templates")
    .select("*")
    .eq("id", templateId)
    .single();
  if (!tpl) redirect("/dashboard/templates");

  const { data: activity } = await supabase
    .from("activities")
    .insert({
      school_id: profile.school_id,
      created_by: profile.id,
      title: tpl.title,
      description: tpl.description,
      mode: tpl.mode as ActivityMode,
      status: "draft",
    })
    .select("id")
    .single();
  if (!activity) redirect("/dashboard/templates");

  const json = (tpl.template_json ?? {}) as TemplateJson;
  let order = 0;
  for (const st of json.stations ?? []) {
    const { data: station } = await supabase
      .from("stations")
      .insert({
        activity_id: activity.id,
        title: st.title,
        location_hint: st.location_hint ?? null,
        order_index: order++,
        points: st.points ?? 10,
      })
      .select("id")
      .single();
    if (!station) continue;
    let mOrder = 0;
    for (const m of st.missions ?? []) {
      await supabase.from("missions").insert({
        station_id: station.id,
        mission_type: m.mission_type,
        prompt: m.prompt,
        answer_options: m.answer_options ?? null,
        correct_answer: m.correct_answer ?? null,
        points: m.points ?? 10,
        knowledge_piece: m.knowledge_piece ?? null,
        order_index: mOrder++,
      });
    }
  }

  redirect(`/dashboard/activities/${activity.id}`);
}
