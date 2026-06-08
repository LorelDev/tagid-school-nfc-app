import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParticipantCookie } from "@/lib/participant";
import type { Mission } from "@/lib/types";

export default async function PlayPage() {
  const cookie = getParticipantCookie();
  if (!cookie) redirect("/join");

  const admin = createAdminClient();

  const { data: session } = await admin
    .from("sessions")
    .select("id, status, activity_id, activities(title)")
    .eq("id", cookie.sessionId)
    .single();

  if (!session) redirect("/join");

  const [{ data: participant }, { data: missions }, { data: submissions }] =
    await Promise.all([
      admin.from("participants").select("score").eq("id", cookie.participantId).single(),
      admin
        .from("missions")
        .select("id, title, position, points")
        .eq("activity_id", session.activity_id)
        .order("position", { ascending: true }),
      admin
        .from("submissions")
        .select("mission_id, is_correct, points_awarded")
        .eq("participant_id", cookie.participantId),
    ]);

  const list = (missions ?? []) as Pick<Mission, "id" | "title" | "position" | "points">[];
  const done = new Set((submissions ?? []).map((s) => s.mission_id));
  const completed = list.filter((m) => done.has(m.id)).length;

  return (
    <main className="mx-auto min-h-screen max-w-md px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {(session.activities as { title?: string } | null)?.title}
          </p>
          <h1 className="text-xl font-bold">Hi {cookie.name}!</h1>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-brand">{participant?.score ?? 0}</div>
          <div className="text-xs text-slate-500">points</div>
        </div>
      </div>

      {session.status !== "live" && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          This session has ended. Thanks for playing!
        </p>
      )}

      <div className="card mt-6">
        <p className="text-sm font-medium">
          Progress: {completed} / {list.length} missions
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-brand transition-all"
            style={{ width: `${list.length ? (completed / list.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <ul className="mt-6 space-y-2">
        {list.map((m, i) => {
          const isDone = done.has(m.id);
          return (
            <li key={m.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
              <span className="flex items-center gap-3">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${isDone ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                  {isDone ? "✓" : i + 1}
                </span>
                <span className={isDone ? "text-slate-400 line-through" : ""}>{m.title}</span>
              </span>
              <span className="text-xs text-slate-400">{m.points} pts</span>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 text-center text-sm text-slate-500">
        📲 Tap an NFC tag around the room to open its mission.
      </p>
      <p className="mt-2 text-center">
        <Link href="/join" className="text-xs text-slate-400 underline">
          Leave session
        </Link>
      </p>
    </main>
  );
}
