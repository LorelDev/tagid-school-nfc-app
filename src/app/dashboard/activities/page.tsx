import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ActivitiesPage() {
  const profile = await requireProfile();
  const supabase = createClient();
  const { data: activities } = await supabase
    .from("activities")
    .select("id, title, description, created_at, missions(count)")
    .eq("teacher_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Activities</h1>
        <Link href="/dashboard/activities/new" className="btn-primary">
          + New activity
        </Link>
      </div>

      {activities && activities.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {activities.map((a) => {
            const missionCount =
              (a.missions as { count: number }[] | null)?.[0]?.count ?? 0;
            return (
              <Link key={a.id} href={`/dashboard/activities/${a.id}`} className="card hover:border-brand">
                <h2 className="font-semibold">{a.title}</h2>
                {a.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                    {a.description}
                  </p>
                )}
                <p className="mt-3 text-xs text-slate-500">
                  {missionCount} mission{missionCount === 1 ? "" : "s"}
                </p>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card text-center text-slate-500">
          No activities yet. Create your first learning trail.
        </div>
      )}
    </div>
  );
}
