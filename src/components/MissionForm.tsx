"use client";

import { useState } from "react";
import { MISSION_TYPE_LABELS, type MissionType } from "@/lib/types";
import { addMission } from "@/app/dashboard/activities/actions";

export function MissionForm({
  stationId,
  activityId,
}: {
  stationId: string;
  activityId: string;
}) {
  const [type, setType] = useState<MissionType>("open_text");
  const isChoice = type === "multiple_choice";
  const hasCorrect =
    type === "multiple_choice" ||
    type === "yes_no" ||
    type === "final_answer";

  return (
    <form action={addMission} className="space-y-3 rounded-xl bg-slate-50 p-3">
      <input type="hidden" name="station_id" value={stationId} />
      <input type="hidden" name="activity_id" value={activityId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">סוג משימה</label>
          <select
            name="mission_type"
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value as MissionType)}
          >
            {(Object.entries(MISSION_TYPE_LABELS) as [MissionType, string][]).map(
              ([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ),
            )}
          </select>
        </div>
        <div>
          <label className="label">ניקוד</label>
          <input name="points" type="number" defaultValue={10} min={0} className="input" />
        </div>
      </div>

      <div>
        <label className="label">השאלה / ההנחיה</label>
        <textarea name="prompt" rows={2} required className="input" placeholder="מה הדבר הראשון ש...?" />
      </div>

      <div>
        <label className="label">טקסט עזרה (לא חובה)</label>
        <input name="helper_text" className="input" placeholder="רמז קטן לתלמידים" />
      </div>

      {isChoice && (
        <div>
          <label className="label">אפשרויות (שורה לכל אפשרות)</label>
          <textarea name="answer_options" rows={3} className="input" placeholder={"אפשרות א\nאפשרות ב\nאפשרות ג"} />
        </div>
      )}

      {hasCorrect && (
        <div>
          <label className="label">תשובה נכונה</label>
          <input name="correct_answer" className="input" placeholder={isChoice ? "אפשרות א" : "התשובה"} />
        </div>
      )}

      {(type === "group_reflection" || type === "knowledge_piece") && (
        <div>
          <label className="label">פיסת ידע שנאספת (לא חובה)</label>
          <input name="knowledge_piece" className="input" placeholder="מידע שייאסף לקראת משימת הסיום" />
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" name="requires_teacher_approval" />
        דורש אישור מורה
      </label>

      <button type="submit" className="btn-secondary">+ הוספת משימה</button>
    </form>
  );
}
