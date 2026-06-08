import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { generateActivityFromTopic } from "@/lib/ai/activity-generator";
import { createFromTemplate } from "./actions";
import { ACTIVITY_MODE_LABELS, type ActivityMode } from "@/lib/types";

export default async function TemplatesPage() {
  const profile = await requireProfile();
  const supabase = createClient();
  const { data: templates } = await supabase
    .from("activity_templates")
    .select("id, title, description, mode, is_global")
    .or(`is_global.eq.true,school_id.eq.${profile.school_id}`)
    .order("created_at", { ascending: false });

  // AI placeholder preview (currently mocked, see src/lib/ai/activity-generator.ts).
  const aiPreview = generateActivityFromTopic("ערכים חברתיים");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">תבניות פעילות</h1>
        <p className="mt-1 text-sm text-slate-600">התחילו מתבנית מוכנה במקום מאפס.</p>
      </div>

      {templates && templates.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {templates.map((t) => (
            <div key={t.id} className="card">
              <div className="flex items-center justify-between">
                <span className="chip bg-brand-light text-brand-dark">
                  {ACTIVITY_MODE_LABELS[t.mode as ActivityMode]}
                </span>
                {t.is_global && <span className="chip bg-slate-100 text-slate-500">תבנית מערכת</span>}
              </div>
              <h2 className="mt-3 font-bold">{t.title}</h2>
              {t.description && <p className="mt-1 text-sm text-slate-600">{t.description}</p>}
              <form action={createFromTemplate} className="mt-4">
                <input type="hidden" name="id" value={t.id} />
                <button className="btn-primary text-sm">יצירת פעילות מהתבנית</button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center text-slate-500">אין תבניות עדיין.</div>
      )}

      <div className="card border-dashed">
        <div className="flex items-center gap-2">
          <span className="chip bg-accent-light text-accent">בקרוב · AI</span>
          <h2 className="font-bold">יצירת פעילות אוטומטית מנושא</h2>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          בעתיד תוכלו להזין נושא/סילבוס והמערכת תפרק אותו לתחנות ומשימות. דוגמה (כרגע מדומה):
        </p>
        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
          <p className="font-medium">{aiPreview.title}</p>
          <ul className="mt-1 list-disc pr-5 text-slate-600">
            {aiPreview.stations.map((s, i) => <li key={i}>{s.title}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
