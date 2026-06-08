"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { MissionType } from "@/lib/types";

export async function createActivity(formData: FormData) {
  const profile = await requireProfile();
  const supabase = createClient();
  const title = String(formData.get("title")).trim();
  const description = String(formData.get("description") || "").trim();

  const { data, error } = await supabase
    .from("activities")
    .insert({ teacher_id: profile.id, title, description: description || null })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  redirect(`/dashboard/activities/${data.id}`);
}

export async function updateActivity(formData: FormData) {
  await requireProfile();
  const supabase = createClient();
  const id = String(formData.get("id"));
  const title = String(formData.get("title")).trim();
  const description = String(formData.get("description") || "").trim();

  const { error } = await supabase
    .from("activities")
    .update({ title, description: description || null })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/activities/${id}`);
}

export async function deleteActivity(formData: FormData) {
  await requireProfile();
  const supabase = createClient();
  const id = String(formData.get("id"));
  await supabase.from("activities").delete().eq("id", id);
  redirect("/dashboard/activities");
}

export async function addMission(formData: FormData) {
  await requireProfile();
  const supabase = createClient();
  const activityId = String(formData.get("activity_id"));
  const type = String(formData.get("type")) as MissionType;
  const rawOptions = String(formData.get("options") || "");
  const options =
    type === "single_choice" || type === "multi_choice"
      ? rawOptions
          .split("\n")
          .map((o) => o.trim())
          .filter(Boolean)
      : null;

  // Determine next position.
  const { count } = await supabase
    .from("missions")
    .select("*", { count: "exact", head: true })
    .eq("activity_id", activityId);

  const { error } = await supabase.from("missions").insert({
    activity_id: activityId,
    position: count ?? 0,
    title: String(formData.get("title")).trim(),
    prompt: String(formData.get("prompt") || "").trim(),
    type,
    options,
    answer: String(formData.get("answer") || "").trim() || null,
    points: Number(formData.get("points") || 10),
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/activities/${activityId}`);
}

export async function deleteMission(formData: FormData) {
  await requireProfile();
  const supabase = createClient();
  const id = String(formData.get("id"));
  const activityId = String(formData.get("activity_id"));
  await supabase.from("missions").delete().eq("id", id);
  revalidatePath(`/dashboard/activities/${activityId}`);
}
