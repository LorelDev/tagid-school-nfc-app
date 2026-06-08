"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { generateTagCode } from "@/lib/codes";

export async function createTag(formData: FormData) {
  const profile = await requireProfile();
  const supabase = createClient();

  // Allow a custom code (e.g. TAG-ENTRANCE) or auto-generate.
  let code = String(formData.get("tag_code") || "").trim().toUpperCase();
  if (!code) {
    code = generateTagCode(6);
    for (let i = 0; i < 5; i++) {
      const { data: existing } = await supabase
        .from("tags")
        .select("id")
        .eq("tag_code", code)
        .maybeSingle();
      if (!existing) break;
      code = generateTagCode(6);
    }
  }

  const { error } = await supabase.from("tags").insert({
    school_id: profile.school_id,
    tag_code: code,
    physical_label: String(formData.get("physical_label") || "").trim() || null,
    location_name: String(formData.get("location_name") || "").trim() || null,
    location_description: String(formData.get("location_description") || "").trim() || null,
  });

  if (error) {
    revalidatePath("/dashboard/tags");
    return;
  }
  revalidatePath("/dashboard/tags");
}

export async function updateTag(formData: FormData) {
  await requireProfile();
  const supabase = createClient();
  const id = String(formData.get("id"));
  await supabase
    .from("tags")
    .update({
      physical_label: String(formData.get("physical_label") || "").trim() || null,
      location_name: String(formData.get("location_name") || "").trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  revalidatePath("/dashboard/tags");
}

export async function deleteTag(formData: FormData) {
  await requireProfile();
  const supabase = createClient();
  await supabase.from("tags").delete().eq("id", String(formData.get("id")));
  revalidatePath("/dashboard/tags");
}
