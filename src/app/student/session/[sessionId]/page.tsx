import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParticipantCookie } from "@/lib/participant";
import { chooseGroup } from "@/app/join/actions";
import type { Mission, Station } from "@/lib/types";

export default async function StudentSessionHome({
  params,
  searchParams,
}: {
  params: { sessionId: string };
  searchParams: { next?: string };
}) {
  const cookie = getParticipantCookie();
  if (!cookie || cookie.sessionId !== params.sessionId) redirect("/join");

  const admin = createAdminClient();
  const { data: session } = await admin
    .from("sessions")
    .select("id, status, activity_id, activities(title)")
    .eq("id", params.sessionId)
    .single();
  if (!session) redirect("/join");

  const activityTitle = (session.activities as { title?: string } | null)?.title ?? "פעילות";

  // Group picker if not yet in a group.
  if (!cookie.groupId) {
    const { data: groups } = await admin
      .from("groups")
      .select("id, name, color")
      .eq("session_id", params.sessionId)
      .order("created_at");

    return (
      <Shell title={activityTitle}>
        <h1 className="text-xl font-bold">שלום {cookie.name}!</h1>
        <p className="mt-1 text-slate-600">בחרו את הקבוצה שלכם:</p>
        <div className="mt-4 grid gap-2">
          {(groups ?? []).map((g) => (
            <form key={g.id} action={chooseGroup}>
              <input type="hidden" name="group_id" value={g.id} />
              <input type="hidden" name="next" value={searchParams.next ?? ""} />
              <button className="card flex w-full items-center gap-3 text-right transition hover:border-brand">
                <span className="h-5 w-5 rounded-full" style={{ background: g.color }} />
                <span className="font-bold">{g.name}</span>
              </button>
            </form>
          ))}
        </div>
      </Shell>
    );
  }

  // Otherwise show progress home.
  const [{ data: participant }, { data: group }, { data: stations }, { data: progress }] =
    await Promise.all([
      admin.from("participants").select("display_name").eq("id", cookie.participantId).single(),
      admin.from("groups").select("name, color, score").eq("id", cookie.groupId).single(),
      admin
        .from("stations")
        .select("id, title, order_index, location_hint, missions(points)")
        .eq("activity_id", session.activity_id)
        .order("order_index"),
      admin
        .from("station_progress")
        .select("station_id, status")
        .eq("group_id", cookie.groupId),
    ]);

  const stationList = (stations ?? []) as (Pick<Station, "id" | "title" | "order_index" | "location_hint"> & {
    missions: Pick<Mission, "points">[];
  })[];
  const completed = new Set(
    (progress ?? []).filter((p) => p.status === "completed").map((p) => p.station_id),
  );
  const doneCount = stationList.filter((s) => completed.has(s.id)).length;

  return (
    <Shell title={activityTitle}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">שלום {cookie.name}!</h1>
          <p className="text-sm" style={{ color: group?.color }}>קבוצת {group?.name}</p>
        </div>
        <div className="text-center">
          <div className="text-3xl font-extrabold text-brand">{group?.score ?? 0}</div>
          <div className="text-xs text-slate-500">ניקוד קבוצתי</div>
        </div>
      </div>

      {session.status === "paused" && (
        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
          הפעילות מושהית כרגע. המתינו להנחיית המורה.
        </p>
      )}
      {session.status === "completed" && (
        <p className="mt-4 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600">
          הפעילות הסתיימה. כל הכבוד!
        </p>
      )}

      <div className="mt-5 rounded-2xl bg-brand-light p-4 text-center">
        <p className="font-bold text-brand-dark">חפשו את התחנה הבאה וגעו בתג 📲</p>
        <p className="mt-1 text-sm text-slate-600">{doneCount}/{stationList.length} תחנות הושלמו</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
          <div className="h-full bg-brand transition-all" style={{ width: `${stationList.length ? (doneCount / stationList.length) * 100 : 0}%` }} />
        </div>
      </div>

      <ul className="mt-5 space-y-2">
        {stationList.map((s, i) => {
          const isDone = completed.has(s.id);
          return (
            <li key={s.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
              <span className="flex items-center gap-3">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${isDone ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                  {isDone ? "✓" : i + 1}
                </span>
                <span className={isDone ? "text-slate-400 line-through" : ""}>
                  {s.title}
                  {s.location_hint && <span className="block text-xs text-slate-400">📍 {s.location_hint}</span>}
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex justify-center gap-4 text-sm">
        <Link href={`/student/leaderboard?session=${params.sessionId}`} className="text-brand">לוח התקדמות</Link>
        <Link href="/join" className="text-slate-400">יציאה</Link>
      </div>
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <p className="text-center text-sm text-slate-500">{title}</p>
      <div className="mt-2">{children}</div>
    </main>
  );
}
