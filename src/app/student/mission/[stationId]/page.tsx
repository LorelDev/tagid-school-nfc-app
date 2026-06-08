import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParticipantCookie } from "@/lib/participant";
import { submitStationAnswers } from "../actions";
import type { Mission } from "@/lib/types";

export default async function MissionPage({ params }: { params: { stationId: string } }) {
  const cookie = getParticipantCookie();
  if (!cookie || !cookie.groupId) redirect("/join");

  const admin = createAdminClient();

  const { data: station } = await admin
    .from("stations")
    .select("id, title, location_hint, activity_id")
    .eq("id", params.stationId)
    .single();
  if (!station) redirect(`/student/session/${cookie.sessionId}`);

  // Already completed -> back to home.
  const { data: progress } = await admin
    .from("station_progress")
    .select("status")
    .eq("group_id", cookie.groupId)
    .eq("station_id", station.id)
    .maybeSingle();
  if (progress?.status === "completed") redirect(`/student/session/${cookie.sessionId}`);

  const { data: missions } = await admin
    .from("missions")
    .select("*")
    .eq("station_id", station.id)
    .order("order_index");

  // Collected knowledge pieces for this group (for final stations).
  const { data: knowledge } = await admin
    .from("responses")
    .select("missions(knowledge_piece)")
    .eq("group_id", cookie.groupId);
  const pieces = (knowledge ?? [])
    .map((r) => (r.missions as { knowledge_piece?: string } | null)?.knowledge_piece)
    .filter(Boolean) as string[];

  const list = (missions ?? []) as Mission[];

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <p className="text-sm font-medium text-brand">משימה נוכחית</p>
      <h1 className="mt-1 text-2xl font-bold">{station.title}</h1>
      {station.location_hint && <p className="mt-1 text-sm text-slate-500">📍 {station.location_hint}</p>}

      {pieces.length > 0 && list.some((m) => m.mission_type === "final_answer") && (
        <div className="mt-4 rounded-xl bg-accent-light p-3 text-sm">
          <p className="font-medium text-accent">פיסות הידע שאספתם:</p>
          <ul className="mt-1 list-disc pr-5 text-slate-600">
            {pieces.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}

      <form action={submitStationAnswers} className="mt-6 space-y-5">
        <input type="hidden" name="station_id" value={station.id} />
        {list.map((m) => (
          <div key={m.id} className="card">
            <p className="font-medium">{m.prompt}</p>
            {m.helper_text && <p className="mt-1 text-xs text-slate-500">{m.helper_text}</p>}
            <div className="mt-3">{renderInput(m)}</div>
          </div>
        ))}
        <button className="btn-accent w-full py-3 text-base">שליחת תשובה</button>
      </form>
    </main>
  );
}

function renderInput(m: Mission) {
  const name = `m_${m.id}`;
  const options = (m.answer_options ?? []) as string[];

  switch (m.mission_type) {
    case "multiple_choice":
    case "yes_no":
      return (
        <div className="space-y-2">
          {options.map((o) => (
            <label key={o} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
              <input type="radio" name={name} value={o} required />
              <span>{o}</span>
            </label>
          ))}
        </div>
      );
    case "rating":
      return (
        <div className="flex justify-between gap-2" dir="ltr">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-lg border border-slate-200 p-2">
              <input type="radio" name={name} value={String(n)} required />
              <span className="text-sm font-bold">{n}</span>
            </label>
          ))}
        </div>
      );
    case "open_text":
    case "group_reflection":
    case "knowledge_piece":
      return <textarea name={name} rows={3} required className="input" placeholder="כתבו כאן..." />;
    case "final_answer":
    default:
      return <input name={name} required className="input" placeholder="התשובה שלכם" />;
  }
}
