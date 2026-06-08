import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MissionForm } from "@/components/MissionForm";
import { deleteMission, updateActivity, deleteActivity } from "../actions";
import { startSession } from "@/app/dashboard/sessions/actions";
import type { Mission } from "@/lib/types";

export default async function ActivityDetail({
  params,
}: {
  params: { id: string };
}) {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data: activity } = await supabase
    .from("activities")
    .select("*")
    .eq("id", params.id)
    .eq("teacher_id", profile.id)
    .single();

  if (!activity) notFound();

  const { data: missions } = await supabase
    .from("missions")
    .select("*")
    .eq("activity_id", params.id)
    .order("position", { ascending: true });

  const list = (missions ?? []) as Mission[];
  const totalPoints = list.reduce((sum, m) => sum + m.points, 0);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard/activities" className="text-sm text-brand">
          ← Activities
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{activity.title}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {list.length} missions · {totalPoints} points total
            </p>
          </div>
          <form action={startSession}>
            <input type="hidden" name="activity_id" value={activity.id} />
            <button className="btn-primary" disabled={list.length === 0}>
              ▶ Start live session
            </button>
          </form>
        </div>
      </div>

      {/* Edit activity details */}
      <details className="card">
        <summary className="cursor-pointer font-semibold">Edit details</summary>
        <form action={updateActivity} className="mt-4 space-y-3">
          <input type="hidden" name="id" value={activity.id} />
          <div>
            <label className="label">Title</label>
            <input name="title" defaultValue={activity.title} className="input" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea name="description" defaultValue={activity.description ?? ""} rows={2} className="input" />
          </div>
          <div className="flex items-center justify-between">
            <button type="submit" className="btn-secondary">Save</button>
          </div>
        </form>
        <form action={deleteActivity} className="mt-3 border-t border-slate-100 pt-3">
          <input type="hidden" name="id" value={activity.id} />
          <button className="text-sm text-red-600 hover:underline">Delete activity</button>
        </form>
      </details>

      {/* Missions list */}
      <section className="space-y-3">
        <h2 className="font-semibold">Missions</h2>
        {list.length === 0 && (
          <p className="text-sm text-slate-500">No missions yet — add the first below.</p>
        )}
        {list.map((m, i) => (
          <div key={m.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-brand-dark">
                    {i + 1}
                  </span>
                  <h3 className="font-medium">{m.title}</h3>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {m.type.replace("_", " ")}
                  </span>
                  <span className="text-xs text-slate-500">{m.points} pts</span>
                </div>
                {m.prompt && <p className="mt-2 text-sm text-slate-600">{m.prompt}</p>}
                {m.options && (
                  <ul className="mt-2 list-disc pl-5 text-sm text-slate-500">
                    {m.options.map((o) => (
                      <li key={o}>
                        {o}
                        {m.answer?.split(",").map((a) => a.trim()).includes(o) && (
                          <span className="ml-1 text-green-600">✓</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <form action={deleteMission}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="activity_id" value={activity.id} />
                <button className="text-sm text-red-600 hover:underline">Remove</button>
              </form>
            </div>
          </div>
        ))}
      </section>

      {/* Add mission */}
      <section className="card">
        <h2 className="mb-4 font-semibold">Add a mission</h2>
        <MissionForm activityId={activity.id} />
      </section>
    </div>
  );
}
