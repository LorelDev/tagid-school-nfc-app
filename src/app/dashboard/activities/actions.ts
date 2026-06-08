"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { ActivityMode, MissionType, UnlockType } from "@/lib/types";

export async function createActivity(formData: FormData) {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("activities")
    .insert({
      school_id: profile.school_id,
      created_by: profile.id,
      title: String(formData.get("title")).trim(),
      description: String(formData.get("description") || "").trim() || null,
      grade_level: String(formData.get("grade_level") || "").trim() || null,
      subject: String(formData.get("subject") || "").trim() || null,
      mode: String(formData.get("mode") || "station_race") as ActivityMode,
      estimated_minutes: Number(formData.get("estimated_minutes") || 45),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  redirect(`/dashboard/activities/${data.id}`);
}

export async function updateActivityStatus(formData: FormData) {
  await requireProfile();
  const supabase = createClient();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  await supabase.from("activities").update({ status }).eq("id", id);
  revalidatePath(`/dashboard/activities/${id}`);
}

export async function deleteActivity(formData: FormData) {
  await requireProfile();
  const supabase = createClient();
  await supabase.from("activities").delete().eq("id", String(formData.get("id")));
  redirect("/dashboard/activities");
}

export async function duplicateActivity(formData: FormData) {
  const profile = await requireProfile();
  const supabase = createClient();
  const sourceId = String(formData.get("id"));

  const { data: src } = await supabase.from("activities").select("*").eq("id", sourceId).single();
  if (!src) redirect("/dashboard/activities");

  const { data: copy } = await supabase
    .from("activities")
    .insert({
      school_id: profile.school_id,
      created_by: profile.id,
      title: `${src.title} (עותק)`,
      description: src.description,
      grade_level: src.grade_level,
      subject: src.subject,
      mode: src.mode,
      estimated_minutes: src.estimated_minutes,
      status: "draft",
    })
    .select("id")
    .single();

  if (!copy) redirect("/dashboard/activities");

  const { data: stations } = await supabase
    .from("stations")
    .select("*, missions(*)")
    .eq("activity_id", sourceId)
    .order("order_index");

  for (const st of stations ?? []) {
    const { data: newSt } = await supabase
      .from("stations")
      .insert({
        activity_id: copy.id,
        tag_id: st.tag_id,
        title: st.title,
        location_hint: st.location_hint,
        order_index: st.order_index,
        unlock_type: st.unlock_type,
        points: st.points,
      })
      .select("id")
      .single();
    if (!newSt) continue;
    for (const m of (st.missions as Record<string, unknown>[]) ?? []) {
      await supabase.from("missions").insert({
        station_id: newSt.id,
        mission_type: m.mission_type,
        prompt: m.prompt,
        helper_text: m.helper_text,
        answer_options: m.answer_options,
        correct_answer: m.correct_answer,
        requires_teacher_approval: m.requires_teacher_approval,
        points: m.points,
        knowledge_piece: m.knowledge_piece,
        order_index: m.order_index,
      });
    }
  }
  redirect(`/dashboard/activities/${copy.id}`);
}

export async function addStation(formData: FormData) {
  await requireProfile();
  const supabase = createClient();
  const activityId = String(formData.get("activity_id"));
  const tagId = String(formData.get("tag_id") || "") || null;
  const dependsOn = String(formData.get("depends_on_station_id") || "") || null;
  const unlockType = (dependsOn ? "dependency" : "open") as UnlockType;

  const { count } = await supabase
    .from("stations")
    .select("*", { count: "exact", head: true })
    .eq("activity_id", activityId);

  const { error } = await supabase.from("stations").insert({
    activity_id: activityId,
    tag_id: tagId,
    title: String(formData.get("title")).trim(),
    location_hint: String(formData.get("location_hint") || "").trim() || null,
    order_index: count ?? 0,
    unlock_type: unlockType,
    depends_on_station_id: dependsOn,
    points: Number(formData.get("points") || 10),
  });
  if (error) throw new Error(error.message);

  // Mark tag assigned.
  if (tagId) await supabase.from("tags").update({ status: "assigned" }).eq("id", tagId);

  revalidatePath(`/dashboard/activities/${activityId}`);
}

export async function deleteStation(formData: FormData) {
  await requireProfile();
  const supabase = createClient();
  const id = String(formData.get("id"));
  const activityId = String(formData.get("activity_id"));
  await supabase.from("stations").delete().eq("id", id);
  revalidatePath(`/dashboard/activities/${activityId}`);
}

export async function addMission(formData: FormData) {
  await requireProfile();
  const supabase = createClient();
  const stationId = String(formData.get("station_id"));
  const activityId = String(formData.get("activity_id"));
  const type = String(formData.get("mission_type")) as MissionType;
  const rawOptions = String(formData.get("answer_options") || "");
  const options =
    type === "multiple_choice"
      ? rawOptions.split("\n").map((o) => o.trim()).filter(Boolean)
      : type === "yes_no"
        ? ["כן", "לא"]
        : null;

  const { count } = await supabase
    .from("missions")
    .select("*", { count: "exact", head: true })
    .eq("station_id", stationId);

  const { error } = await supabase.from("missions").insert({
    station_id: stationId,
    mission_type: type,
    prompt: String(formData.get("prompt") || "").trim(),
    helper_text: String(formData.get("helper_text") || "").trim() || null,
    answer_options: options,
    correct_answer: String(formData.get("correct_answer") || "").trim() || null,
    requires_teacher_approval: formData.get("requires_teacher_approval") === "on",
    points: Number(formData.get("points") || 10),
    knowledge_piece: String(formData.get("knowledge_piece") || "").trim() || null,
    order_index: count ?? 0,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/activities/${activityId}`);
}

export async function deleteMission(formData: FormData) {
  await requireProfile();
  const supabase = createClient();
  await supabase.from("missions").delete().eq("id", String(formData.get("id")));
  revalidatePath(`/dashboard/activities/${String(formData.get("activity_id"))}`);
}
