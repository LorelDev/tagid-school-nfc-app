import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StationForm } from "@/components/StationForm";
import { MissionForm } from "@/components/MissionForm";
import {
  deleteStation,
  deleteMission,
  updateActivityStatus,
  deleteActivity,
  duplicateActivity,
} from "../actions";
import {
  ACTIVITY_MODE_LABELS,
  MISSION_TYPE_LABELS,
  type ActivityMode,
  type Mission,
  type MissionType,
} from "@/lib/types";

export default async function ActivityDetail({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data: activity } = await supabase
    .from("activities")
    .select("*")
    .eq("id", params.id)
    .eq("school_id", profile.school_id)
    .single();
  if (!activity) notFound();

  const [{ data: stations }, { data: tags }] = await Promise.all([
    supabase
      .from("stations")
      .select("*, missions(*), tags(tag_code, location_name)")
      .eq("activity_id", params.id)
      .order("order_index"),
    supabase
      .from("tags")
      .select("id, tag_code, location_name")
      .eq("school_id", profile.school_id)
      .order("created_at"),
  ]);

  const stationList = stations ?? [];
  const totalPoints = stationList.reduce(
    (sum, s) =>
      sum + ((s.missions as Mission[]) ?? []).reduce((a, m) => a + m.points, 0),
    0,
  );

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard/activities" className="text-sm text-brand">→ פעילויות</Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{activity.title}</h1>
              <span className="chip bg-brand-light text-brand-dark">
                {ACTIVITY_MODE_LABELS[activity.mode as ActivityMode]}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {stationList.length} תחנות · {totalPoints} נק׳
              {activity.subject ? ` · ${activity.subject}` : ""}
              {activity.grade_level ? ` · ${activity.grade_level}` : ""}
            </p>
          </div>
          <Link
            href={`/dashboard/activities/${activity.id}/start`}
            className={`btn-accent ${stationList.length === 0 ? "pointer-events-none opacity-50" : ""}`}
          >
            ▶ התחלת פעילות
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <form action={updateActivityStatus}>
          <input type="hidden" name="id" value={activity.id} />
          <input type="hidden" name="status" value={activity.status === "published" ? "draft" : "published"} />
          <button className="btn-secondary text-sm">
            {activity.status === "published" ? "החזרה לטיוטה" : "פרסום פעילות"}
          </button>
        </form>
        <form action={duplicateActivity}>
          <input type="hidden" name="id" value={activity.id} />
          <button className="btn-secondary text-sm">שכפול</button>
        </form>
        <form action={deleteActivity}>
          <input type="hidden" name="id" value={activity.id} />
          <button className="btn-ghost text-sm text-red-600">מחיקה</button>
        </form>
      </div>

      {/* Stations */}
      <section className="space-y-4">
        <h2 className="font-bold">תחנות ומשימות</h2>
        {stationList.length === 0 && (
          <p className="text-sm text-slate-500">עדיין אין תחנות — הוסיפו את הראשונה למטה.</p>
        )}

        {stationList.map((s, i) => {
          const tag = s.tags as { tag_code?: string; location_name?: string } | null;
          const missions = ((s.missions as Mission[]) ?? []).sort(
            (a, b) => a.order_index - b.order_index,
          );
          return (
            <div key={s.id} className="card space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <h3 className="font-bold">{s.title}</h3>
                    <span className="text-xs text-slate-500">{s.points} נק׳</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {s.location_hint ? `📍 ${s.location_hint} · ` : ""}
                    {tag?.tag_code ? `🏷️ ${tag.tag_code}` : "ללא תג"}
                    {s.depends_on_station_id ? " · 🔒 נעולה עד השלמת תחנה קודמת" : ""}
                  </p>
                </div>
                <form action={deleteStation}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="activity_id" value={activity.id} />
                  <button className="text-sm text-red-600 hover:underline">הסרה</button>
                </form>
              </div>

              {missions.length > 0 && (
                <ul className="space-y-2">
                  {missions.map((m) => (
                    <li key={m.id} className="flex items-start justify-between rounded-lg border border-slate-100 p-2.5">
                      <div>
                        <span className="chip bg-slate-100 text-slate-600">
                          {MISSION_TYPE_LABELS[m.mission_type as MissionType]}
                        </span>
                        <p className="mt-1 text-sm">{m.prompt}</p>
                        {m.correct_answer && (
                          <p className="mt-0.5 text-xs text-green-600">תשובה: {m.correct_answer}</p>
                        )}
                      </div>
                      <form action={deleteMission}>
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="activity_id" value={activity.id} />
                        <button className="text-xs text-red-600 hover:underline">הסרה</button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}

              <details>
                <summary className="cursor-pointer text-sm font-medium text-brand">+ הוספת משימה לתחנה</summary>
                <div className="mt-3">
                  <MissionForm stationId={s.id} activityId={activity.id} />
                </div>
              </details>
            </div>
          );
        })}
      </section>

      {/* Add station */}
      <section className="card">
        <h2 className="mb-4 font-bold">הוספת תחנה</h2>
        <StationForm
          activityId={activity.id}
          tags={tags ?? []}
          stations={stationList.map((s) => ({ id: s.id, title: s.title }))}
        />
      </section>
    </div>
  );
}
