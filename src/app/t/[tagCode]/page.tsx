import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParticipantCookie } from "@/lib/participant";

// Public NFC/QR resolver. A physical tag stores /t/<tagCode>.
export default async function TagResolver({ params }: { params: { tagCode: string } }) {
  const code = decodeURIComponent(params.tagCode).toUpperCase();
  const admin = createAdminClient();

  // 1. Resolve the tag.
  const { data: tag } = await admin
    .from("tags")
    .select("id, tag_code, location_name")
    .eq("tag_code", code)
    .maybeSingle();
  if (!tag) return <State emoji="❓" title="תג לא נמצא" body={`התג ${code} אינו רשום במערכת.`} />;

  // 2. Require a joined participant.
  const cookie = getParticipantCookie();
  if (!cookie) redirect(`/join?next=${encodeURIComponent(`/t/${code}`)}`);

  // 3. Find the station that uses this tag within the participant's activity.
  const { data: session } = await admin
    .from("sessions")
    .select("id, status, activity_id")
    .eq("id", cookie.sessionId)
    .single();
  if (!session) redirect("/join");

  const { data: station } = await admin
    .from("stations")
    .select("id, title, depends_on_station_id, activity_id")
    .eq("tag_id", tag.id)
    .eq("activity_id", session.activity_id)
    .maybeSingle();

  if (!station) {
    return (
      <State
        emoji="🚫"
        title="התג לא שייך לפעילות"
        body="התג הזה אינו חלק מהפעילות הנוכחית שלכם."
        href="/student/session"
      />
    );
  }

  // 4. Session state checks.
  if (session.status === "completed")
    return <State emoji="🏁" title="הפעילות הסתיימה" body="תודה שהשתתפתם!" />;
  if (session.status === "paused")
    return <State emoji="⏸️" title="הפעילות מושהית" body="המתינו להנחיית המורה ונסו שוב." />;
  if (session.status !== "active")
    return <State emoji="⌛" title="אין פעילות פעילה לתג הזה כרגע" body="חזרו כשהמורה יתחיל את הפעילות." />;

  // 5. Need a group.
  if (!cookie.groupId)
    redirect(`/student/session/${session.id}?next=${encodeURIComponent(`/t/${code}`)}`);

  const groupId = cookie.groupId;

  // 6. Dependency lock.
  if (station.depends_on_station_id) {
    const { data: dep } = await admin
      .from("station_progress")
      .select("status")
      .eq("group_id", groupId)
      .eq("station_id", station.depends_on_station_id)
      .maybeSingle();
    if (dep?.status !== "completed") {
      return (
        <State
          emoji="🔒"
          title="התחנה עדיין נעולה"
          body="חזרו אליה אחרי שתשלימו את התחנה הקודמת."
          href={`/student/session/${session.id}`}
        />
      );
    }
  }

  // 7. Already completed?
  const { data: progress } = await admin
    .from("station_progress")
    .select("status")
    .eq("group_id", groupId)
    .eq("station_id", station.id)
    .maybeSingle();

  if (progress?.status === "completed") {
    return (
      <State
        emoji="✅"
        title="כבר השלמתם את התחנה הזו"
        body="עברו לתחנה הבאה."
        href={`/student/session/${session.id}`}
      />
    );
  }

  // 8. Ensure an unlocked progress row + record the scan event.
  await admin.from("station_progress").upsert(
    {
      session_id: session.id,
      group_id: groupId,
      station_id: station.id,
      status: "in_progress",
      unlocked_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
    },
    { onConflict: "group_id,station_id" },
  );
  await admin.from("events").insert({
    session_id: session.id,
    group_id: groupId,
    participant_id: cookie.participantId,
    tag_id: tag.id,
    station_id: station.id,
    event_type: "scan",
  });

  redirect(`/student/mission/${station.id}`);
}

function State({
  emoji,
  title,
  body,
  href,
}: {
  emoji: string;
  title: string;
  body: string;
  href?: string;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="card w-full">
        <div className="text-5xl">{emoji}</div>
        <h1 className="mt-3 text-xl font-bold">{title}</h1>
        <p className="mt-1 text-slate-600">{body}</p>
        <Link href={href ?? "/join"} className="btn-primary mt-6">חזרה</Link>
      </div>
    </main>
  );
}
