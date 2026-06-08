import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SESSION_STATUS_LABELS, type SessionStatus } from "@/lib/types";

const chip: Record<SessionStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  active: "bg-green-100 text-green-700",
  paused: "bg-amber-100 text-amber-700",
  completed: "bg-slate-100 text-slate-500",
};

export default async function SessionsPage() {
  const profile = await requireProfile();
  const supabase = createClient();
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, session_code, status, created_at, activities(title), groups(count)")
    .eq("school_id", profile.school_id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">מפגשים</h1>

      {sessions && sessions.length > 0 ? (
        <div className="space-y-3">
          {sessions.map((s) => {
            const groups = (s.groups as { count: number }[] | null)?.[0]?.count ?? 0;
            const ended = s.status === "completed";
            return (
              <Link
                key={s.id}
                href={ended ? `/dashboard/reports/${s.id}` : `/dashboard/sessions/${s.id}`}
                className="card flex items-center justify-between transition hover:border-brand"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">
                      {(s.activities as { title?: string } | null)?.title ?? "פעילות"}
                    </span>
                    <span className={`chip ${chip[s.status as SessionStatus]}`}>
                      {SESSION_STATUS_LABELS[s.status as SessionStatus]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{groups} קבוצות</p>
                </div>
                <span className="font-mono text-brand" dir="ltr">{s.session_code} ←</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card text-center text-slate-500">
          <p className="text-lg font-medium">אין מפגשים עדיין</p>
          <p className="mt-1 text-sm">התחילו מפגש מתוך עמוד הפעילות.</p>
        </div>
      )}
    </div>
  );
}
