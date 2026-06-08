"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { generateSessionCode, GROUP_COLORS } from "@/lib/codes";

export async function startSession(formData: FormData) {
  const profile = await requireProfile();
  const supabase = createClient();
  const activityId = String(formData.get("activity_id"));
  const className = String(formData.get("class_name") || "").trim();
  const groupNames = String(formData.get("group_names") || "")
    .split("\n")
    .map((g) => g.trim())
    .filter(Boolean);

  // Unique session code.
  let code = generateSessionCode();
  for (let i = 0; i < 6; i++) {
    const { data: existing } = await supabase
      .from("sessions")
      .select("id")
      .eq("session_code", code)
      .maybeSingle();
    if (!existing) break;
    code = generateSessionCode();
  }

  let classId: string | null = null;
  if (className) {
    const { data: cls } = await supabase
      .from("classes")
      .insert({ school_id: profile.school_id, name: className })
      .select("id")
      .single();
    classId = cls?.id ?? null;
  }

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({
      activity_id: activityId,
      school_id: profile.school_id,
      teacher_id: profile.id,
      class_id: classId,
      session_code: code,
      status: "active",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const groups = (groupNames.length > 0 ? groupNames : ["כחולים", "כתומים", "ירוקים"]).map(
    (name, i) => ({
      session_id: session.id,
      name,
      color: GROUP_COLORS[i % GROUP_COLORS.length],
    }),
  );
  await supabase.from("groups").insert(groups);

  redirect(`/dashboard/sessions/${session.id}`);
}

async function setStatus(id: string, status: string, extra: Record<string, unknown> = {}) {
  const supabase = createClient();
  await supabase.from("sessions").update({ status, ...extra }).eq("id", id);
  revalidatePath(`/dashboard/sessions/${id}`);
}

export async function pauseSession(formData: FormData) {
  await requireProfile();
  await setStatus(String(formData.get("id")), "paused", { paused_at: new Date().toISOString() });
}
export async function resumeSession(formData: FormData) {
  await requireProfile();
  await setStatus(String(formData.get("id")), "active", { paused_at: null });
}
export async function endSession(formData: FormData) {
  await requireProfile();
  const id = String(formData.get("id"));
  await setStatus(id, "completed", { ended_at: new Date().toISOString() });
  redirect(`/dashboard/reports/${id}`);
}

export async function addBonus(formData: FormData) {
  await requireProfile();
  const supabase = createClient();
  const sessionId = String(formData.get("session_id"));
  const groupId = String(formData.get("group_id"));
  const points = Number(formData.get("points") || 5);
  await supabase.rpc("add_group_score", { p_group: groupId, p_points: points });
  await supabase.from("events").insert({
    session_id: sessionId,
    group_id: groupId,
    event_type: "bonus",
    event_payload: { points },
  });
  revalidatePath(`/dashboard/sessions/${sessionId}`);
}

export async function unlockStation(formData: FormData) {
  await requireProfile();
  const supabase = createClient();
  const sessionId = String(formData.get("session_id"));
  const groupId = String(formData.get("group_id"));
  const stationId = String(formData.get("station_id"));
  await supabase
    .from("station_progress")
    .upsert(
      {
        session_id: sessionId,
        group_id: groupId,
        station_id: stationId,
        status: "unlocked",
        unlocked_at: new Date().toISOString(),
      },
      { onConflict: "group_id,station_id" },
    );
  await supabase.from("events").insert({
    session_id: sessionId,
    group_id: groupId,
    station_id: stationId,
    event_type: "manual_unlock",
  });
  revalidatePath(`/dashboard/sessions/${sessionId}`);
}
