"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { setParticipantCookie } from "@/lib/participant";

export async function joinSession(formData: FormData) {
  const joinCode = String(formData.get("join_code") || "").trim().toUpperCase();
  const name = String(formData.get("display_name") || "").trim();
  const next = String(formData.get("next") || "");

  if (!joinCode || !name) {
    redirect(`/join?error=${encodeURIComponent("Enter a code and your name.")}`);
  }

  const admin = createAdminClient();

  const { data: session } = await admin
    .from("sessions")
    .select("id, status")
    .eq("join_code", joinCode)
    .maybeSingle();

  if (!session) {
    redirect(`/join?error=${encodeURIComponent("No session found for that code.")}`);
  }
  if (session.status !== "live") {
    redirect(`/join?error=${encodeURIComponent("That session is not live right now.")}`);
  }

  const { data: participant, error } = await admin
    .from("participants")
    .insert({ session_id: session.id, display_name: name })
    .select("id")
    .single();

  if (error) {
    redirect(`/join?error=${encodeURIComponent(error.message)}`);
  }

  setParticipantCookie({
    participantId: participant.id,
    sessionId: session.id,
    name,
  });

  // If the student scanned a tag before joining, send them straight to it.
  redirect(next || "/play");
}
