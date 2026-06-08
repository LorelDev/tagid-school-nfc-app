"use client";

import { addStation } from "@/app/dashboard/activities/actions";
import type { Station, Tag } from "@/lib/types";

export function StationForm({
  activityId,
  tags,
  stations,
}: {
  activityId: string;
  tags: Pick<Tag, "id" | "tag_code" | "location_name">[];
  stations: Pick<Station, "id" | "title">[];
}) {
  return (
    <form action={addStation} className="space-y-3">
      <input type="hidden" name="activity_id" value={activityId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">שם התחנה</label>
          <input name="title" required className="input" placeholder="שער הכניסה" />
        </div>
        <div>
          <label className="label">ניקוד התחנה</label>
          <input name="points" type="number" defaultValue={10} className="input" />
        </div>
      </div>
      <div>
        <label className="label">רמז מיקום</label>
        <input name="location_hint" className="input" placeholder="ליד הכניסה הראשית" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">שיוך תג NFC</label>
          <select name="tag_id" className="input">
            <option value="">— ללא —</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.tag_code}{t.location_name ? ` · ${t.location_name}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">נעולה עד השלמת תחנה</label>
          <select name="depends_on_station_id" className="input">
            <option value="">— פתוחה תמיד —</option>
            {stations.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>
      </div>
      <button type="submit" className="btn-primary">+ הוספת תחנה</button>
    </form>
  );
}
