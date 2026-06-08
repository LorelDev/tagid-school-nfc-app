import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardHome() {
  const profile = await requireProfile();
  const supabase = createClient();

  const [{ count: activityCount }, { count: tagCount }, { data: liveSessions }] =
    await Promise.all([
      supabase
        .from("activities")
        .select("*", { count: "exact", head: true })
        .eq("teacher_id", profile.id),
      supabase
        .from("nfc_tags")
        .select("*", { count: "exact", head: true })
        .eq("teacher_id", profile.id),
      supabase
        .from("sessions")
        .select("id, join_code, status, activities(title)")
        .eq("teacher_id", profile.id)
        .eq("status", "live")
        .order("created_at", { ascending: false }),
    ]);

  const stats = [
    { label: "Activities", value: activityCount ?? 0, href: "/dashboard/activities" },
    { label: "NFC Tags", value: tagCount ?? 0, href: "/dashboard/tags" },
    { label: "Live sessions", value: liveSessions?.length ?? 0, href: "/dashboard/sessions" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back{profile.full_name ? `, ${profile.full_name}` : ""}
        </h1>
        <p className="mt-1 text-slate-600">
          Build learning trails, manage NFC tags, and run live sessions.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card hover:border-brand">
            <div className="text-3xl font-bold text-brand">{s.value}</div>
            <div className="mt-1 text-sm text-slate-600">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Live now</h2>
          <Link href="/dashboard/sessions" className="text-sm font-medium text-brand">
            All sessions →
          </Link>
        </div>
        {liveSessions && liveSessions.length > 0 ? (
          <ul className="mt-3 divide-y divide-slate-100">
            {liveSessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2">
                <span>
                  {(s.activities as { title?: string } | null)?.title ?? "Activity"}
                </span>
                <Link
                  href={`/dashboard/sessions/${s.id}`}
                  className="font-mono text-sm text-brand"
                >
                  {s.join_code} →
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            No live sessions. Start one from an activity.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/activities/new" className="btn-primary">
          + New activity
        </Link>
        <Link href="/dashboard/tags" className="btn-secondary">
          Manage NFC tags
        </Link>
      </div>
    </div>
  );
}
