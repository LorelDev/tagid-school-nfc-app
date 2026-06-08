import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParticipantCookie } from "@/lib/participant";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { session?: string };
}) {
  const cookie = getParticipantCookie();
  const sessionId = searchParams.session || cookie?.sessionId;
  if (!sessionId) redirect("/join");

  const admin = createAdminClient();
  const { data: groups } = await admin
    .from("groups")
    .select("id, name, color, score")
    .eq("session_id", sessionId)
    .order("score", { ascending: false });

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <h1 className="text-center text-2xl font-bold">לוח התקדמות</h1>
      <p className="mt-1 text-center text-sm text-slate-500">ניקוד קבוצתי</p>

      <ol className="mt-6 space-y-3">
        {(groups ?? []).map((g, i) => (
          <li
            key={g.id}
            className={`flex items-center justify-between rounded-2xl border bg-white px-4 py-3 ${cookie?.groupId === g.id ? "border-brand ring-2 ring-brand/20" : "border-slate-200"}`}
          >
            <span className="flex items-center gap-3">
              <span className="w-7 text-center text-xl">{medals[i] ?? `${i + 1}.`}</span>
              <span className="h-4 w-4 rounded-full" style={{ background: g.color }} />
              <span className="font-bold">{g.name}</span>
            </span>
            <span className="text-xl font-extrabold text-brand">{g.score}</span>
          </li>
        ))}
      </ol>

      <div className="mt-8 text-center">
        <Link href={cookie ? `/student/session/${cookie.sessionId}` : "/join"} className="btn-primary">
          חזרה לפעילות
        </Link>
      </div>
    </main>
  );
}
