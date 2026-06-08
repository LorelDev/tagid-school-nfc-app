"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { generateCode } from "@/lib/codes";

export async function startSession(formData: FormData) {
  const profile = await requireProfile();
  const supabase = createClient();
  const activityId = String(formData.get("activity_id"));

  // Generate a unique join code.
  let joinCode = generateCode(5);
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await supabase
      .from("sessions")
      .select("id")
      .eq("join_code", joinCode)
      .maybeSingle();
    if (!existing) break;
    joinCode = generateCode(5);
  }

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      activity_id: activityId,
      teacher_id: profile.id,
      join_code: joinCode,
      status: "live",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  redirect(`/dashboard/sessions/${data.id}`);
}

export async function endSession(formData: FormData) {
  await requireProfile();
  const supabase = createClient();
  const id = String(formData.get("id"));
  await supabase
    .from("sessions")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath(`/dashboard/sessions/${id}`);
}
