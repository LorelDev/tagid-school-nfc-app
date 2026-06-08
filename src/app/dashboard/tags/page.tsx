import QRCode from "qrcode";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { tagUrl } from "@/lib/codes";
import { CopyButton } from "@/components/CopyButton";
import { createTag, deleteTag } from "./actions";

export default async function TagsPage() {
  const profile = await requireProfile();
  const supabase = createClient();
  const baseUrl = env.baseUrl();

  const { data: tags } = await supabase
    .from("tags")
    .select("id, tag_code, physical_label, location_name, status, stations(title, activities(title))")
    .eq("school_id", profile.school_id)
    .order("created_at", { ascending: false });

  const qrByCode: Record<string, string> = {};
  for (const t of tags ?? []) {
    qrByCode[t.tag_code] = await QRCode.toDataURL(tagUrl(baseUrl, t.tag_code), {
      width: 180,
      margin: 1,
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">ניהול תגים</h1>
        <p className="mt-1 text-sm text-slate-600">
          צרו תג, שייכו אותו לתחנה, וכתבו את הכתובת על מדבקת NFC פיזית. לכל תג יש גם QR לגיבוי.
        </p>
      </div>

      <form action={createTag} className="card grid gap-3 sm:grid-cols-4">
        <div>
          <label className="label">קוד תג (לא חובה)</label>
          <input name="tag_code" className="input" placeholder="TAG-ENTRANCE" dir="ltr" />
        </div>
        <div>
          <label className="label">תווית פיזית</label>
          <input name="physical_label" className="input" placeholder="מדבקה כחולה" />
        </div>
        <div>
          <label className="label">מיקום</label>
          <input name="location_name" className="input" placeholder="כניסה ראשית" />
        </div>
        <div className="flex items-end">
          <button className="btn-primary w-full">+ יצירת תג</button>
        </div>
      </form>

      {tags && tags.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {tags.map((t) => {
            const url = tagUrl(baseUrl, t.tag_code);
            const station = t.stations as { title?: string; activities?: { title?: string } } | null;
            return (
              <div key={t.id} className="card flex gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrByCode[t.tag_code]} alt={`QR ${t.tag_code}`} className="h-28 w-28 rounded border border-slate-100" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold" dir="ltr">{t.tag_code}</span>
                    {t.location_name && <span className="text-xs text-slate-500">· {t.location_name}</span>}
                  </div>
                  <p className="mt-1 break-all text-xs text-slate-500" dir="ltr">{url}</p>
                  <p className="mt-1 text-xs">
                    {station?.title ? (
                      <span className="text-green-700">→ {station.activities?.title} · {station.title}</span>
                    ) : (
                      <span className="text-amber-600">לא משויך לתחנה</span>
                    )}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <CopyButton value={url} label="העתקת כתובת" />
                    <form action={deleteTag}>
                      <input type="hidden" name="id" value={t.id} />
                      <button className="py-1 text-xs text-red-600 hover:underline">מחיקה</button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center text-slate-500">
          <p className="text-lg font-medium">אין תגיות מחוברות עדיין</p>
          <p className="mt-1 text-sm">צרו את התג הראשון למעלה.</p>
        </div>
      )}
    </div>
  );
}
