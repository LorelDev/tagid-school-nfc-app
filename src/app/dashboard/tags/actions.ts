"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { generateCode } from "@/lib/codes";

export async function createTag(formData: FormData) {
  const profile = await requireProfile();
  const supabase = createClient();
  const label = String(formData.get("label") || "").trim();
  const missionId = String(formData.get("mission_id") || "") || null;

  // Generate a unique tag code.
  let code = generateCode(6);
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await supabase
      .from("nfc_tags")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!existing) break;
    code = generateCode(6);
  }

  const { error } = await supabase.from("nfc_tags").insert({
    teacher_id: profile.id,
    code,
    label: label || null,
    mission_id: missionId,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/tags");
}

export async function bindTag(formData: FormData) {
  await requireProfile();
  const supabase = createClient();
  const id = String(formData.get("id"));
  const missionId = String(formData.get("mission_id") || "") || null;
  await supabase.from("nfc_tags").update({ mission_id: missionId }).eq("id", id);
  revalidatePath("/dashboard/tags");
}

export async function deleteTag(formData: FormData) {
  await requireProfile();
  const supabase = createClient();
  const id = String(formData.get("id"));
  await supabase.from("nfc_tags").delete().eq("id", id);
  revalidatePath("/dashboard/tags");
}
