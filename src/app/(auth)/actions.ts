"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function login(formData: FormData) {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const redirectTo = String(formData.get("redirect") || "/dashboard");

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent("פרטי ההתחברות שגויים")}`);
  }
  revalidatePath("/", "layout");
  redirect(redirectTo || "/dashboard");
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const fullName = String(formData.get("full_name"));
  const schoolName = String(formData.get("school_name") || "").trim();

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role: "teacher" } },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // If we have a session, ensure the teacher is attached to a school.
  if (data.user && data.session) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("school_id, role")
      .eq("id", data.user.id)
      .single();

    if (profile && !profile.school_id && profile.role !== "super_admin") {
      const { data: school } = await admin
        .from("schools")
        .insert({ name: schoolName || "בית הספר שלי" })
        .select("id")
        .single();
      if (school) {
        await admin
          .from("profiles")
          .update({ school_id: school.id })
          .eq("id", data.user.id);
      }
    }
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  redirect(
    `/signup?message=${encodeURIComponent("החשבון נוצר. אשרו את האימייל ואז התחברו.")}`,
  );
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
