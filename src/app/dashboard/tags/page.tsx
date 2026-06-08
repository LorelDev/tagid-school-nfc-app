import QRCode from "qrcode";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { tagUrl } from "@/lib/codes";
import { CopyButton } from "@/components/CopyButton";
import { createTag, bindTag, deleteTag } from "./actions";

export default async function TagsPage() {
  const profile = await requireProfile();
  const supabase = createClient();
  const baseUrl = env.baseUrl();

  const [{ data: tags }, { data: missions }] = await Promise.all([
    supabase
      .from("nfc_tags")
      .select("id, code, label, mission_id, missions(title, activities(title))")
      .eq("teacher_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("missions")
      .select("id, title, activities!inner(teacher_id, title)")
      .eq("activities.teacher_id", profile.id),
  ]);

  const missionOptions = (missions ?? []) as unknown as {
    id: string;
    title: string;
    activities: { title: string };
  }[];

  // Pre-render QR data URLs on the server (offline, no external calls).
  const qrByCode: Record<string, string> = {};
  for (const t of tags ?? []) {
    qrByCode[t.code] = await QRCode.toDataURL(tagUrl(baseUrl, t.code), {
      width: 160,
      margin: 1,
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">NFC Tags</h1>
        <p className="mt-1 text-sm text-slate-600">
          Generate a tag, bind it to a mission, then write its URL onto a physical
          NFC sticker.
        </p>
      </div>

      <form action={createTag} className="card flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <label className="label">Label (optional)</label>
          <input name="label" className="input" placeholder="Hallway poster, Lab bench 3..." />
        </div>
        <div className="flex-1">
          <label className="label">Bind to mission (optional)</label>
          <select name="mission_id" className="input">
            <option value="">— none —</option>
            {missionOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.activities?.title} · {m.title}
              </option>
            ))}
          </select>
        </div>
        <button className="btn-primary">+ Generate tag</button>
      </form>

      {tags && tags.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {tags.map((t) => {
            const url = tagUrl(baseUrl, t.code);
            const mission = t.missions as { title?: string; activities?: { title?: string } } | null;
            return (
              <div key={t.id} className="card flex gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrByCode[t.code]} alt={`QR for ${t.code}`} className="h-28 w-28 rounded border border-slate-100" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">{t.code}</span>
                    {t.label && <span className="text-xs text-slate-500">· {t.label}</span>}
                  </div>
                  <p className="mt-1 break-all text-xs text-slate-500">{url}</p>
                  <p className="mt-1 text-xs">
                    {mission?.title ? (
                      <span className="text-green-700">
                        → {mission.activities?.title} · {mission.title}
                      </span>
                    ) : (
                      <span className="text-amber-600">Not bound to a mission</span>
                    )}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <CopyButton value={url} label="Copy URL" />
                    <form action={bindTag} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={t.id} />
                      <select name="mission_id" defaultValue={t.mission_id ?? ""} className="input py-1 text-xs">
                        <option value="">— none —</option>
                        {missionOptions.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.activities?.title} · {m.title}
                          </option>
                        ))}
                      </select>
                      <button className="btn-secondary py-1 text-xs">Bind</button>
                    </form>
                    <form action={deleteTag}>
                      <input type="hidden" name="id" value={t.id} />
                      <button className="py-1 text-xs text-red-600 hover:underline">Delete</button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center text-slate-500">
          No tags yet. Generate your first NFC tag above.
        </div>
      )}
    </div>
  );
}
