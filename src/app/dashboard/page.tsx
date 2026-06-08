import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SESSION_STATUS_LABELS } from "@/lib/types";

export default async function DashboardHome() {
  const profile = await requireProfile();
  const supabase = createClient();
  const schoolId = profile.school_id;

  const [{ count: activityCount }, { count: tagCount }, { data: sessions }] =
    await Promise.all([
      supabase.from("activities").select("*", { count: "exact", head: true }).eq("school_id", schoolId),
      supabase.from("tags").select("*", { count: "exact", head: true }).eq("school_id", schoolId),
      supabase
        .from("sessions")
        .select("id, session_code, status, activities(title)")
        .eq("school_id", schoolId)
        .in("status", ["active", "paused"])
        .order("created_at", { ascending: false }),
    ]);

  const stats = [
    { label: "פעילויות", value: activityCount ?? 0, href: "/dashboard/activities" },
    { label: "תגים", value: tagCount ?? 0, href: "/dashboard/tags" },
    { label: "מפגשים פעילים", value: sessions?.length ?? 0, href: "/dashboard/sessions" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          שלום{profile.full_name ? `, ${profile.full_name}` : ""} 👋
        </h1>
        <p className="mt-1 text-slate-600">בנו פעילויות, נהלו תגים והפעילו מפגשים חיים.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card transition hover:border-brand">
            <div className="text-3xl font-extrabold text-brand">{s.value}</div>
            <div className="mt-1 text-sm text-slate-600">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">פעיל עכשיו</h2>
          <Link href="/dashboard/sessions" className="text-sm font-semibold text-brand">
            כל המפגשים ←
          </Link>
        </div>
        {sessions && sessions.length > 0 ? (
          <ul className="mt-3 divide-y divide-slate-100">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2.5">
                <span className="font-medium">
                  {(s.activities as { title?: string } | null)?.title ?? "פעילות"}
                </span>
                <Link href={`/dashboard/sessions/${s.id}`} className="flex items-center gap-2 text-sm text-brand">
                  <span className="chip bg-green-100 text-green-700">
                    {SESSION_STATUS_LABELS[s.status as keyof typeof SESSION_STATUS_LABELS]}
                  </span>
                  <span className="font-mono">{s.session_code} ←</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-500">אין מפגשים פעילים. התחילו מפגש מתוך פעילות.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/activities/new" className="btn-primary">+ פעילות חדשה</Link>
        <Link href="/dashboard/tags" className="btn-secondary">ניהול תגים</Link>
      </div>
    </div>
  );
}
