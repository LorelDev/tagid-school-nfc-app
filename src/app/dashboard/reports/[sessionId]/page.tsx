import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Mission, Station } from "@/lib/types";

export default async function ReportPage({ params }: { params: { sessionId: string } }) {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("*, activities(id, title)")
    .eq("id", params.sessionId)
    .eq("school_id", profile.school_id)
    .single();
  if (!session) notFound();

  const [{ data: groups }, { data: stations }, { data: progress }, { data: responses }, { data: participants }] =
    await Promise.all([
      supabase.from("groups").select("id, name, color, score").eq("session_id", params.sessionId).order("score", { ascending: false }),
      supabase.from("stations").select("id, title, order_index, missions(id, prompt)").eq("activity_id", session.activity_id).order("order_index"),
      supabase.from("station_progress").select("group_id, station_id, status").eq("session_id", params.sessionId),
      supabase.from("responses").select("group_id, station_id, mission_id, answer_text, is_correct, points_awarded").eq("session_id", params.sessionId),
      supabase.from("participants").select("id").eq("session_id", params.sessionId),
    ]);

  const groupList = groups ?? [];
  const stationList = (stations ?? []) as (Pick<Station, "id" | "title" | "order_index"> & {
    missions: Pick<Mission, "id" | "prompt">[];
  })[];
  const completedCount = (progress ?? []).filter((p) => p.status === "completed").length;
  const totalSlots = groupList.length * stationList.length;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard/sessions" className="text-sm text-brand">→ מפגשים</Link>
        <h1 className="mt-1 text-2xl font-bold">דוח פעילות</h1>
        <p className="mt-1 text-sm text-slate-600">
          {(session.activities as { title?: string } | null)?.title} · קוד {session.session_code}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "קבוצות", value: groupList.length },
          { label: "משתתפים", value: participants?.length ?? 0 },
          { label: "תחנות שהושלמו", value: `${completedCount}/${totalSlots}` },
          { label: "תשובות", value: responses?.length ?? 0 },
        ].map((s) => (
          <div key={s.label} className="card">
            <div className="text-2xl font-extrabold text-brand">{s.value}</div>
            <div className="mt-1 text-sm text-slate-600">{s.label}</div>
          </div>
        ))}
      </div>

      {/* leaderboard */}
      <div className="card">
        <h2 className="font-bold">דירוג קבוצות</h2>
        <ol className="mt-3 space-y-2">
          {groupList.map((g, i) => (
            <li key={g.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
              <span className="flex items-center gap-2">
                <span className="font-bold text-slate-400">{i + 1}.</span>
                <span className="h-3 w-3 rounded-full" style={{ background: g.color }} />
                {g.name}
              </span>
              <span className="font-extrabold text-brand">{g.score} נק׳</span>
            </li>
          ))}
        </ol>
      </div>

      {/* answers by station */}
      <div className="space-y-4">
        <h2 className="font-bold">תשובות לפי תחנה</h2>
        {stationList.map((st) => {
          const missionIds = st.missions.map((m) => m.id);
          const stationResponses = (responses ?? []).filter((r) => missionIds.includes(r.mission_id));
          return (
            <div key={st.id} className="card">
              <h3 className="font-semibold">{st.order_index + 1}. {st.title}</h3>
              {stationResponses.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">אין תשובות.</p>
              ) : (
                <ul className="mt-2 space-y-1.5 text-sm">
                  {stationResponses.map((r, idx) => {
                    const g = groupList.find((x) => x.id === r.group_id);
                    return (
                      <li key={idx} className="rounded-lg bg-slate-50 px-3 py-2">
                        <span className="font-medium" style={{ color: g?.color }}>{g?.name}: </span>
                        <span>{r.answer_text || "—"}</span>
                        <span className="mr-2 text-xs text-slate-400">({r.points_awarded} נק׳)</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
