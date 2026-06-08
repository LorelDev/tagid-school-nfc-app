import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { startSession } from "@/app/dashboard/sessions/actions";

export default async function StartSessionPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  const supabase = createClient();
  const { data: activity } = await supabase
    .from("activities")
    .select("id, title")
    .eq("id", params.id)
    .eq("school_id", profile.school_id)
    .single();
  if (!activity) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link href={`/dashboard/activities/${activity.id}`} className="text-sm text-brand">→ {activity.title}</Link>
        <h1 className="mt-2 text-2xl font-bold">התחלת פעילות</h1>
        <p className="mt-1 text-sm text-slate-600">הגדירו כיתה וקבוצות, וקבלו קוד הצטרפות לתלמידים.</p>
      </div>

      <form action={startSession} className="card space-y-4">
        <input type="hidden" name="activity_id" value={activity.id} />
        <div>
          <label className="label" htmlFor="class_name">שם הכיתה</label>
          <input id="class_name" name="class_name" className="input" placeholder="ז׳ 3" />
        </div>
        <div>
          <label className="label" htmlFor="group_names">שמות הקבוצות (שורה לכל קבוצה)</label>
          <textarea
            id="group_names"
            name="group_names"
            rows={4}
            className="input"
            defaultValue={"כחולים\nכתומים\nירוקים"}
          />
          <p className="mt-1 text-xs text-slate-500">תלמידים יבחרו קבוצה בעת ההצטרפות.</p>
        </div>
        <button type="submit" className="btn-accent w-full">▶ הפעלת מפגש</button>
      </form>
    </div>
  );
}
