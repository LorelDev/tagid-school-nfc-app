import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Live data for the teacher dashboard (polled every few seconds).
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const sessionId = params.id;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [{ data: session }, { data: groups }, { data: progress }, { data: events }, { data: participants }] =
    await Promise.all([
      supabase.from("sessions").select("id, status, session_code").eq("id", sessionId).single(),
      supabase.from("groups").select("id, name, color, score").eq("session_id", sessionId).order("score", { ascending: false }),
      supabase.from("station_progress").select("group_id, station_id, status, completed_at").eq("session_id", sessionId),
      supabase
        .from("events")
        .select("id, event_type, group_id, station_id, created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase.from("participants").select("id, display_name, group_id").eq("session_id", sessionId),
    ]);

  return NextResponse.json({
    session,
    groups: groups ?? [],
    progress: progress ?? [],
    events: events ?? [],
    participants: participants ?? [],
  });
}
