"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParticipantCookie } from "@/lib/participant";
import { scoreAnswer } from "@/lib/scoring";
import type { Mission } from "@/lib/types";

export async function submitStationAnswers(formData: FormData) {
  const stationId = String(formData.get("station_id"));
  const cookie = getParticipantCookie();
  if (!cookie || !cookie.groupId) redirect("/join");
  const groupId = cookie.groupId;

  const admin = createAdminClient();

  // Guard: session must be active.
  const { data: session } = await admin
    .from("sessions")
    .select("status")
    .eq("id", cookie.sessionId)
    .single();
  if (session?.status !== "active") redirect(`/student/mission/${stationId}`);

  // Guard: not already completed (prevents double scoring).
  const { data: existing } = await admin
    .from("station_progress")
    .select("status")
    .eq("group_id", groupId)
    .eq("station_id", stationId)
    .maybeSingle();
  if (existing?.status === "completed") {
    redirect(`/student/session/${cookie.sessionId}`);
  }

  const { data: missions } = await admin
    .from("missions")
    .select("*")
    .eq("station_id", stationId)
    .order("order_index");

  let totalPoints = 0;
  let allCorrect = true;

  for (const mission of (missions ?? []) as Mission[]) {
    const answer = String(formData.get(`m_${mission.id}`) ?? "").trim();
    const result = scoreAnswer(mission, answer);
    if (!result.isCorrect) allCorrect = false;
    totalPoints += result.points;

    await admin
      .from("responses")
      .upsert(
        {
          session_id: cookie.sessionId,
          group_id: groupId,
          participant_id: cookie.participantId,
          station_id: stationId,
          mission_id: mission.id,
          answer_text: answer,
          is_correct: result.isCorrect,
          points_awarded: result.points,
          teacher_approved: result.needsApproval ? null : true,
        },
        { onConflict: "group_id,mission_id" },
      );
  }

  // Mark station completed.
  await admin
    .from("station_progress")
    .upsert(
      {
        session_id: cookie.sessionId,
        group_id: groupId,
        station_id: stationId,
        status: "completed",
        completed_at: new Date().toISOString(),
        completed_by_participant_id: cookie.participantId,
      },
      { onConflict: "group_id,station_id" },
    );

  if (totalPoints > 0) {
    await admin.rpc("add_group_score", { p_group: groupId, p_points: totalPoints });
  }

  await admin.from("events").insert({
    session_id: cookie.sessionId,
    group_id: groupId,
    participant_id: cookie.participantId,
    station_id: stationId,
    event_type: "complete",
    event_payload: { points: totalPoints },
  });

  redirect(
    `/student/success?station=${stationId}&points=${totalPoints}&correct=${allCorrect ? 1 : 0}`,
  );
}
