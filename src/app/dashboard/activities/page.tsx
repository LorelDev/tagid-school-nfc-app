import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  ACTIVITY_MODE_LABELS,
  ACTIVITY_STATUS_LABELS,
  type ActivityMode,
  type ActivityStatus,
} from "@/lib/types";

const statusChip: Record<ActivityStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  published: "bg-green-100 text-green-700",
  archived: "bg-amber-100 text-amber-700",
};

export default async function ActivitiesPage() {
  const profile = await requireProfile();
  const supabase = createClient();
  const { data: activities } = await supabase
    .from("activities")
    .select("id, title, description, mode, status, stations(count)")
    .eq("school_id", profile.school_id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">פעילויות</h1>
        <Link href="/dashboard/activities/new" className="btn-primary">+ פעילות חדשה</Link>
      </div>

      {activities && activities.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {activities.map((a) => {
            const count = (a.stations as { count: number }[] | null)?.[0]?.count ?? 0;
            return (
              <Link key={a.id} href={`/dashboard/activities/${a.id}`} className="card transition hover:border-brand">
                <div className="flex items-center justify-between">
                  <span className={`chip ${statusChip[a.status as ActivityStatus]}`}>
                    {ACTIVITY_STATUS_LABELS[a.status as ActivityStatus]}
                  </span>
                  <span className="chip bg-brand-light text-brand-dark">
                    {ACTIVITY_MODE_LABELS[a.mode as ActivityMode]}
                  </span>
                </div>
                <h2 className="mt-3 font-bold">{a.title}</h2>
                {a.description && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{a.description}</p>}
                <p className="mt-3 text-xs text-slate-500">{count} תחנות</p>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card text-center text-slate-500">
          <p className="text-lg font-medium">עדיין אין פעילויות</p>
          <p className="mt-1 text-sm">צרו את הפעילות הראשונה שלכם.</p>
          <Link href="/dashboard/activities/new" className="btn-primary mt-4 inline-flex">+ פעילות חדשה</Link>
        </div>
      )}
    </div>
  );
}
