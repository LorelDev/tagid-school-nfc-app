import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParticipantCookie } from "@/lib/participant";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { station?: string; points?: string; correct?: string };
}) {
  const cookie = getParticipantCookie();
  const correct = searchParams.correct === "1";
  const points = Number(searchParams.points ?? 0);

  // Find the next station + its location hint as the next-station clue.
  let nextHint = "חפשו את התחנה הבאה וגעו בתג.";
  let allDone = false;
  if (cookie?.groupId && searchParams.station) {
    const admin = createAdminClient();
    const { data: station } = await admin
      .from("stations")
      .select("activity_id, order_index")
      .eq("id", searchParams.station)
      .single();
    if (station) {
      const { data: next } = await admin
        .from("stations")
        .select("title, location_hint")
        .eq("activity_id", station.activity_id)
        .gt("order_index", station.order_index)
        .order("order_index")
        .limit(1)
        .maybeSingle();
      if (next) {
        nextHint = next.location_hint
          ? `התחנה הבאה: ${next.title} · 📍 ${next.location_hint}`
          : `התחנה הבאה: ${next.title}`;
      } else {
        allDone = true;
      }
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="card w-full">
        <div className="text-6xl">{correct ? "🎉" : "💪"}</div>
        <h1 className="mt-3 text-2xl font-bold">{correct ? "כל הכבוד!" : "תשובה נשמרה"}</h1>
        {points > 0 && <p className="mt-1 text-lg font-semibold text-brand">+{points} נקודות</p>}

        <div className="mt-5 rounded-2xl bg-brand-light p-4 text-brand-dark">
          {allDone ? "🏁 סיימתם את כל התחנות! עברו ללוח ההתקדמות." : nextHint}
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Link href={cookie ? `/student/session/${cookie.sessionId}` : "/join"} className="btn-primary">
            המשך לתחנות שלי
          </Link>
          <Link
            href={cookie ? `/student/leaderboard?session=${cookie.sessionId}` : "/join"}
            className="btn-secondary"
          >
            לוח התקדמות
          </Link>
        </div>
      </div>
    </main>
  );
}
