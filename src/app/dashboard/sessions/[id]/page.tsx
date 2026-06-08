import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { LiveBoard } from "@/components/LiveBoard";
import { CopyButton } from "@/components/CopyButton";
import {
  pauseSession,
  resumeSession,
  endSession,
  addBonus,
  unlockStation,
} from "../actions";
import { SESSION_STATUS_LABELS, type SessionStatus, type Station } from "@/lib/types";

export default async function LiveSessionPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("*, activities(id, title)")
    .eq("id", params.id)
    .eq("school_id", profile.school_id)
    .single();
  if (!session) notFound();

  const [{ data: stations }, { data: groups }, { data: progress }, { data: events }, { data: participants }] =
    await Promise.all([
      supabase
        .from("stations")
        .select("id, title, order_index")
        .eq("activity_id", session.activity_id)
        .order("order_index"),
      supabase.from("groups").select("id, name, color, score").eq("session_id", params.id).order("score", { ascending: false }),
      supabase.from("station_progress").select("group_id, station_id, status, completed_at").eq("session_id", params.id),
      supabase.from("events").select("id, event_type, group_id, station_id, created_at").eq("session_id", params.id).order("created_at", { ascending: false }).limit(30),
      supabase.from("participants").select("id, display_name, group_id").eq("session_id", params.id),
    ]);

  const stationList = (stations ?? []) as Pick<Station, "id" | "title" | "order_index">[];
  const status = session.status as SessionStatus;
  const joinUrl = `${env.baseUrl().replace(/\/$/, "")}/join?code=${session.session_code}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/dashboard/sessions" className="text-sm text-brand">→ מפגשים</Link>
          <h1 className="mt-1 text-2xl font-bold">
            {(session.activities as { title?: string } | null)?.title}
          </h1>
          <span className={`chip mt-1 ${status === "active" ? "bg-green-100 text-green-700" : status === "paused" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
            {SESSION_STATUS_LABELS[status]}
          </span>
        </div>

        <div className="card text-center">
          <p className="text-xs text-slate-500">קוד הצטרפות</p>
          <p className="font-mono text-2xl font-extrabold text-brand" dir="ltr">{session.session_code}</p>
          <div className="mt-2 flex gap-2">
            <CopyButton value={joinUrl} label="העתקת קישור" />
            <Link href="/join" target="_blank" className="btn-secondary py-1 text-xs">פתיחת מסך תלמיד</Link>
          </div>
        </div>
      </div>

      {/* controls */}
      <div className="flex flex-wrap gap-2">
        {status === "active" && (
          <form action={pauseSession}>
            <input type="hidden" name="id" value={session.id} />
            <button className="btn-secondary">⏸ השהיית פעילות</button>
          </form>
        )}
        {status === "paused" && (
          <form action={resumeSession}>
            <input type="hidden" name="id" value={session.id} />
            <button className="btn-secondary">▶ המשך פעילות</button>
          </form>
        )}
        {status !== "completed" && (
          <form action={endSession}>
            <input type="hidden" name="id" value={session.id} />
            <button className="btn-ghost text-red-600">⏹ סיום פעילות</button>
          </form>
        )}
        <Link href={`/dashboard/reports/${session.id}`} className="btn-secondary">דוח פעילות</Link>
      </div>

      <LiveBoard
        sessionId={session.id}
        stations={stationList}
        initial={{
          groups: groups ?? [],
          progress: progress ?? [],
          events: events ?? [],
          participants: participants ?? [],
        }}
      />

      {/* manual teacher controls */}
      <div className="card">
        <h3 className="font-bold">בקרת מורה</h3>
        <p className="mt-1 text-xs text-slate-500">הענקת בונוס או פתיחת תחנה ידנית לקבוצה שתקועה.</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <form action={addBonus} className="space-y-2 rounded-xl bg-slate-50 p-3">
            <input type="hidden" name="session_id" value={session.id} />
            <p className="text-sm font-medium">נקודות בונוס</p>
            <select name="group_id" className="input">
              {(groups ?? []).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <input name="points" type="number" defaultValue={5} className="input" />
            <button className="btn-secondary text-sm">הוספת בונוס</button>
          </form>

          <form action={unlockStation} className="space-y-2 rounded-xl bg-slate-50 p-3">
            <input type="hidden" name="session_id" value={session.id} />
            <p className="text-sm font-medium">פתיחת תחנה</p>
            <select name="group_id" className="input">
              {(groups ?? []).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <select name="station_id" className="input">
              {stationList.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            <button className="btn-secondary text-sm">פתיחה ידנית</button>
          </form>
        </div>
      </div>
    </div>
  );
}
