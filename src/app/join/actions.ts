"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { setParticipantCookie, getParticipantCookie } from "@/lib/participant";

export async function joinSession(formData: FormData) {
  const code = String(formData.get("session_code") || "").trim().toUpperCase();
  const name = String(formData.get("display_name") || "").trim();
  const next = String(formData.get("next") || "");

  if (!code || !name) {
    redirect(`/join?error=${encodeURIComponent("הזינו קוד ושם")}&next=${encodeURIComponent(next)}`);
  }

  const admin = createAdminClient();
  const { data: session } = await admin
    .from("sessions")
    .select("id, status")
    .eq("session_code", code)
    .maybeSingle();

  if (!session) {
    redirect(`/join?error=${encodeURIComponent("לא נמצאה פעילות לקוד הזה")}&next=${encodeURIComponent(next)}`);
  }
  if (session.status === "completed") {
    redirect(`/join?error=${encodeURIComponent("הפעילות הסתיימה")}&next=${encodeURIComponent(next)}`);
  }

  const { data: participant, error } = await admin
    .from("participants")
    .insert({ session_id: session.id, display_name: name })
    .select("id")
    .single();
  if (error) {
    redirect(`/join?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  await admin.from("events").insert({
    session_id: session.id,
    participant_id: participant.id,
    event_type: "join",
    event_payload: { name },
  });

  setParticipantCookie({
    participantId: participant.id,
    sessionId: session.id,
    sessionCode: code,
    groupId: null,
    name,
  });

  redirect(`/student/session/${session.id}${next ? `?next=${encodeURIComponent(next)}` : ""}`);
}

export async function chooseGroup(formData: FormData) {
  const cookie = getParticipantCookie();
  if (!cookie) redirect("/join");

  const groupId = String(formData.get("group_id"));
  const next = String(formData.get("next") || "");
  const admin = createAdminClient();

  await admin.from("participants").update({ group_id: groupId }).eq("id", cookie.participantId);

  setParticipantCookie({ ...cookie, groupId });

  redirect(next || `/student/session/${cookie.sessionId}`);
}
