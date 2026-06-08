// ---------------------------------------------------------------------------
// תגיד – demo data seeder
//
//   node scripts/seed.mjs
//
// Reads Supabase credentials from .env.local (or the environment) and creates:
//   • demo school + class
//   • demo teacher (teacher@tagid.demo / Tagid123!)
//   • 5 NFC tags
//   • the "מסע היכרות עם בית הספר" activity with 5 stations + missions
//   • an ACTIVE session (TAGID-1234) with 3 groups
//   • one global activity template
//
// Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
// ---------------------------------------------------------------------------
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// --- load .env.local if present ---
try {
  const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* no .env.local — rely on real environment */
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });
const DEMO_EMAIL = "teacher@tagid.demo";
const DEMO_PASSWORD = "Tagid123!";

async function main() {
  console.log("Seeding תגיד demo data…");

  // 1. School
  const { data: school } = await db
    .from("schools")
    .insert({ name: "בית ספר הדגמה תגיד", city: "תל אביב" })
    .select("id")
    .single();
  console.log("✓ school", school.id);

  // 2. Teacher auth user + profile
  const { data: created, error: userErr } = await db.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "מורה הדגמה", role: "teacher" },
  });
  let teacherId;
  if (userErr) {
    console.log("• teacher exists, fetching…");
    const { data: list } = await db.auth.admin.listUsers();
    teacherId = list.users.find((u) => u.email === DEMO_EMAIL)?.id;
  } else {
    teacherId = created.user.id;
  }
  await db.from("profiles").update({ school_id: school.id, role: "teacher", full_name: "מורה הדגמה" }).eq("id", teacherId);
  console.log("✓ teacher", DEMO_EMAIL, "/", DEMO_PASSWORD);

  // 3. Class
  const { data: cls } = await db
    .from("classes")
    .insert({ school_id: school.id, name: "ז׳ 3", grade: "ז׳" })
    .select("id")
    .single();

  // 4. Tags
  const tagDefs = [
    ["TAG-ENTRANCE", "שער הכניסה"],
    ["TAG-LIBRARY", "הספרייה"],
    ["TAG-YARD", "החצר"],
    ["TAG-LAB", "חדר המחשבים"],
    ["TAG-COUNSELOR", "חדר ייעוץ"],
  ];
  const tags = {};
  for (const [code, loc] of tagDefs) {
    const { data } = await db
      .from("tags")
      .insert({ school_id: school.id, tag_code: code, location_name: loc, status: "assigned" })
      .select("id")
      .single();
    tags[code] = data.id;
  }
  console.log("✓ 5 tags");

  // 5. Activity
  const { data: activity } = await db
    .from("activities")
    .insert({
      school_id: school.id,
      created_by: teacherId,
      title: "מסע היכרות עם בית הספר",
      description: "פעילות תחנות להיכרות עם המרחב והקהילה הבית-ספרית.",
      grade_level: "ז׳",
      subject: "חברתי",
      mode: "station_race",
      status: "published",
      estimated_minutes: 45,
    })
    .select("id")
    .single();

  // 6. Stations + missions
  const stationDefs = [
    {
      title: "שער הכניסה", tag: "TAG-ENTRANCE", points: 10, hint: "ליד הכניסה הראשית",
      mission: { mission_type: "open_text", prompt: "מה הדבר הראשון שגורם לכם להרגיש שייכים במקום חדש?", points: 10 },
    },
    {
      title: "הספרייה", tag: "TAG-LIBRARY", points: 15, hint: "בכניסה לספרייה",
      mission: {
        mission_type: "multiple_choice",
        prompt: "למי תפנו אם תצטרכו עזרה בלמידה?",
        answer_options: ["מחנכת", "ספרנית", "חבר", "כל התשובות נכונות"],
        correct_answer: "כל התשובות נכונות",
        points: 15,
      },
    },
    {
      title: "החצר", tag: "TAG-YARD", points: 20, hint: "ליד הספסלים בחצר",
      mission: { mission_type: "group_reflection", prompt: "כתבו פעולה אחת שיכולה לעזור לתלמיד שמרגיש לבד בהפסקה.", points: 20, knowledge_piece: "דרך לעזור למי שמרגיש לבד" },
    },
    {
      title: "חדר המחשבים", tag: "TAG-LAB", points: 20, hint: "במעבדת המחשבים",
      mission: { mission_type: "open_text", prompt: "מצאו רעיון טכנולוגי קטן שיכול לשפר את בית הספר.", points: 20, knowledge_piece: "רעיון טכנולוגי לשיפור" },
    },
    {
      title: "תחנת סיום", tag: "TAG-COUNSELOR", points: 30, hint: "ליד חדר הייעוץ", dependsOnPrev: true,
      mission: { mission_type: "final_answer", prompt: "חברו את כל התשובות שלכם למשפט אחד: בית ספר טוב הוא מקום שבו...", points: 30 },
    },
  ];

  let prevStationId = null;
  let order = 0;
  for (const s of stationDefs) {
    const { data: station } = await db
      .from("stations")
      .insert({
        activity_id: activity.id,
        tag_id: tags[s.tag],
        title: s.title,
        location_hint: s.hint,
        order_index: order++,
        unlock_type: s.dependsOnPrev ? "dependency" : "open",
        depends_on_station_id: s.dependsOnPrev ? prevStationId : null,
        points: s.points,
      })
      .select("id")
      .single();
    await db.from("missions").insert({
      station_id: station.id,
      mission_type: s.mission.mission_type,
      prompt: s.mission.prompt,
      answer_options: s.mission.answer_options ?? null,
      correct_answer: s.mission.correct_answer ?? null,
      points: s.mission.points,
      knowledge_piece: s.mission.knowledge_piece ?? null,
      order_index: 0,
    });
    prevStationId = station.id;
  }
  console.log("✓ activity with 5 stations");

  // 7. Active session + groups
  const { data: session } = await db
    .from("sessions")
    .insert({
      activity_id: activity.id,
      school_id: school.id,
      teacher_id: teacherId,
      class_id: cls.id,
      session_code: "TAGID-1234",
      status: "active",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  const groupColors = ["#0ea5b7", "#f97316", "#22c55e"];
  for (const [i, name] of ["כחולים", "כתומים", "ירוקים"].entries()) {
    await db.from("groups").insert({ session_id: session.id, name, color: groupColors[i] });
  }
  console.log("✓ active session TAGID-1234 with 3 groups");

  // 8. Global template
  await db.from("activity_templates").insert({
    title: "מסע היכרות עם בית הספר",
    description: "תבנית מוכנה להיכרות תלמידים חדשים עם המרחב הבית-ספרי.",
    mode: "station_race",
    is_global: true,
    template_json: {
      stations: stationDefs.map((s) => ({
        title: s.title,
        location_hint: s.hint,
        points: s.points,
        missions: [s.mission],
      })),
    },
  });
  console.log("✓ global template");

  console.log("\nDone! Log in at /login with", DEMO_EMAIL, "/", DEMO_PASSWORD);
  console.log("Students can join at /join with code TAGID-1234");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
