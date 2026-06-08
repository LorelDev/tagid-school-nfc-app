"use client";

import { useEffect, useState } from "react";

type Group = { id: string; name: string; color: string; score: number };
type Progress = { group_id: string; station_id: string; status: string; completed_at: string | null };
type EventRow = { id: string; event_type: string; group_id: string | null; station_id: string | null; created_at: string };
type Participant = { id: string; display_name: string; group_id: string | null };
type Station = { id: string; title: string; order_index: number };

type LiveData = {
  groups: Group[];
  progress: Progress[];
  events: EventRow[];
  participants: Participant[];
};

const EVENT_LABELS: Record<string, string> = {
  scan: "נגיעה בתג",
  complete: "השלמת תחנה",
  bonus: "נקודות בונוס",
  manual_unlock: "פתיחה ידנית",
  join: "הצטרפות",
};

export function LiveBoard({
  sessionId,
  stations,
  initial,
}: {
  sessionId: string;
  stations: Station[];
  initial: LiveData;
}) {
  const [data, setData] = useState<LiveData>(initial);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/live`, { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as LiveData;
        if (active) setData(json);
      } catch {
        /* ignore transient network errors */
      }
    };
    const interval = setInterval(tick, 4000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [sessionId]);

  const completedByGroup = (gid: string) =>
    data.progress.filter((p) => p.group_id === gid && p.status === "completed").length;
  const membersByGroup = (gid: string) =>
    data.participants.filter((p) => p.group_id === gid).length;

  return (
    <div className="space-y-6">
      {/* group progress cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.groups.map((g) => {
          const done = completedByGroup(g.id);
          const pct = stations.length ? (done / stations.length) * 100 : 0;
          return (
            <div key={g.id} className="card">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold">
                  <span className="h-3 w-3 rounded-full" style={{ background: g.color }} />
                  {g.name}
                </span>
                <span className="text-lg font-extrabold text-brand">{g.score}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {membersByGroup(g.id)} משתתפים · {done}/{stations.length} תחנות
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full transition-all" style={{ width: `${pct}%`, background: g.color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* timeline */}
      <div className="card">
        <h3 className="font-bold">ציר זמן</h3>
        {data.events.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">עדיין אין אירועים. מחכים לנגיעה ראשונה בתג…</p>
        ) : (
          <ul className="mt-3 space-y-1.5 text-sm">
            {data.events.map((e) => {
              const g = data.groups.find((x) => x.id === e.group_id);
              const st = stations.find((x) => x.id === e.station_id);
              return (
                <li key={e.id} className="flex items-center justify-between border-b border-slate-50 pb-1.5">
                  <span>
                    {g && <span className="font-medium" style={{ color: g.color }}>{g.name} </span>}
                    {EVENT_LABELS[e.event_type] ?? e.event_type}
                    {st ? ` · ${st.title}` : ""}
                  </span>
                  <span className="text-xs text-slate-400" dir="ltr">
                    {new Date(e.created_at).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
