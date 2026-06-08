import Link from "next/link";
import { createActivity } from "../actions";
import { ACTIVITY_MODE_LABELS, type ActivityMode } from "@/lib/types";

export default function NewActivityPage() {
  const modes = Object.entries(ACTIVITY_MODE_LABELS) as [ActivityMode, string][];
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link href="/dashboard/activities" className="text-sm text-brand">→ פעילויות</Link>
        <h1 className="mt-2 text-2xl font-bold">פעילות חדשה</h1>
      </div>

      <form action={createActivity} className="card space-y-4">
        <div>
          <label className="label" htmlFor="title">שם הפעילות</label>
          <input id="title" name="title" required className="input" placeholder="מסע היכרות עם בית הספר" />
        </div>
        <div>
          <label className="label" htmlFor="description">תיאור</label>
          <textarea id="description" name="description" rows={3} className="input" placeholder="מה התלמידים ילמדו..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="grade_level">שכבת גיל</label>
            <input id="grade_level" name="grade_level" className="input" placeholder="ז׳" />
          </div>
          <div>
            <label className="label" htmlFor="subject">תחום / מקצוע</label>
            <input id="subject" name="subject" className="input" placeholder="חברתי" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="mode">סוג פעילות</label>
            <select id="mode" name="mode" className="input">
              {modes.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="estimated_minutes">משך משוער (דק׳)</label>
            <input id="estimated_minutes" name="estimated_minutes" type="number" defaultValue={45} className="input" />
          </div>
        </div>
        <button type="submit" className="btn-primary w-full">יצירת פעילות</button>
      </form>
    </div>
  );
}
