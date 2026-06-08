# תגיד (Tagid) – NFC-based Interactive Learning Platform for Schools

> **לגעת. לגלות. להגיד.**
> הופכים את בית הספר למרחב למידה אינטראקטיבי.

**תגיד** turns a school building into an interactive learning space. Teachers
place **NFC tags** around the school (entrance, library, yard, computer lab,
counselor room…). Students tap a tag with their phone (or scan a QR fallback),
receive a **mission**, answer it in their **group**, earn points, and unlock the
next **station** — all tracked live on the teacher dashboard.

The name is a double meaning: **Tag-ID** (NFC tag identity) and **תגיד** —
_"say / express / share"_.

---

## ✨ Highlights

- 🇮🇱 **Hebrew, RTL, mobile-first** UI (PWA-friendly — no app store needed).
- 👩‍🏫 **Teacher dashboard** — activities, stations, missions, tags, live sessions, reports.
- 🧩 **Activity builder** — stations with **dependencies / locking** and 7 mission types.
- 🏷️ **NFC tag management** — generate tag URLs + **QR fallback** for every tag.
- 📲 **NFC resolver** `/t/[tagCode]` — full state machine (not joined / locked / completed / paused…).
- 👥 **Groups / teams**, group scoring, **knowledge-piece collection** for final challenges.
- ⚡ **Live session dashboard** — polling updates, timeline, pause/resume/end, bonus & manual unlock.
- 📊 **Reports** — leaderboard + answers by station.
- 🌱 **Seeded demo data** + 🤖 AI activity-generator placeholder.
- 🔒 **Privacy by design** — students need no email/account.

---

## 🧱 Tech Stack

| Layer     | Tech                                   |
| --------- | -------------------------------------- |
| Framework | Next.js 14 (App Router) + TypeScript   |
| UI        | React + Tailwind CSS (RTL)             |
| Data/Auth | Supabase (PostgreSQL + Auth + RLS)     |
| Realtime  | Polling (Supabase Realtime-ready)      |
| Hosting   | Vercel (recommended) / any Node host   |

---

## 📁 Project Structure

```
tagid-school-nfc-app/
├── README.md
├── .env.example                     # copy to .env.local
├── package.json                     # npm run dev | build | seed
├── supabase/
│   ├── schema.sql                   # all tables, enums, RLS, triggers, helpers
│   └── seed.sql                     # global template (SQL-only)
├── scripts/
│   └── seed.mjs                     # full demo seeder (school, teacher, session…)
└── src/
    ├── app/
    │   ├── page.tsx                 # landing  (לגעת. לגלות. להגיד.)
    │   ├── (auth)/login | signup    # teacher auth
    │   ├── dashboard/               # teacher area
    │   │   ├── page.tsx             # overview
    │   │   ├── activities/          # list / new / [id] builder / [id]/start
    │   │   ├── tags/                # NFC tag management + QR
    │   │   ├── sessions/            # list + [id] live dashboard
    │   │   ├── reports/[sessionId]/ # session report
    │   │   └── templates/           # templates + AI placeholder
    │   ├── join/                    # student join by code
    │   ├── student/                 # session home / mission / success / leaderboard
    │   ├── t/[tagCode]/             # NFC/QR resolver
    │   ├── api/sessions/[id]/live/  # live polling endpoint
    │   ├── privacy | terms
    ├── components/                  # Nav, StationForm, MissionForm, LiveBoard, CopyButton
    └── lib/
        ├── supabase/ (client|server|admin|middleware)
        ├── auth.ts  types.ts  codes.ts  scoring.ts  participant.ts  env.ts
        └── ai/activity-generator.ts # mocked, structured for real LLMs later
```

---

## 🚀 Run Locally

### 1. Clone & install
```bash
git clone https://github.com/LorelDev/tagid-school-nfc-app.git
cd tagid-school-nfc-app
npm install
```

### 2. Environment
```bash
cp .env.example .env.local
# fill in the Supabase values (next section)
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public anon key (browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server-only** — student flow + seeding |
| `NEXT_PUBLIC_BASE_URL` | base for tag URLs, e.g. `http://localhost:3000` |

### 3. Start
```bash
npm run dev
# http://localhost:3000
```

---

## 🗄️ Supabase Setup

1. Create a free project at <https://supabase.com>.
2. **Project Settings → API** → copy `Project URL`, `anon public`, and
   `service_role` into `.env.local`.
3. **SQL Editor** → paste and run **`supabase/schema.sql`**.
4. Seed demo data (recommended — creates the demo teacher auth user):
   ```bash
   npm run seed
   ```
   Or, for a template only without a teacher, run `supabase/seed.sql`.
5. **Auth → Providers → Email**: for the smoothest demo, disable
   "Confirm email" so teacher signup logs in immediately.

> RLS is enabled. Teachers/admins see only their own school's data; the
> anonymous student flow runs server-side with the service role key.

### Demo credentials (after `npm run seed`)
| Role | Email | Password |
| --- | --- | --- |
| Teacher | `teacher@tagid.demo` | `Tagid123!` |

Students join with session code **`TAGID-1234`** (no account needed).

---

## 📲 Programming the Physical NFC Tags

Each tag maps to a URL shown in **Dashboard → ניהול תגים**, e.g.:
```
https://your-app.com/t/TAG-ENTRANCE
```

**Hardware:** NTAG213/215 stickers (cheap, widely supported).

**Easiest (phone):**
1. Install **NFC Tools** (iOS/Android) or **NXP TagWriter** (Android).
2. **Write → Add a record → URL/URI**.
3. Paste the tag URL from the dashboard.
4. **Write**, then hold the tag to the back of the phone.
5. Tap again to verify it opens the URL.

**Tips:**
- Write it as an **NDEF URI record** (not plain text) so phones auto-open it.
- Optionally **lock** the tag after writing (read-only).
- Print the **QR code** shown next to each tag as a fallback for devices without NFC.

---

## ✅ Demo Flow (acceptance test)

1. `npm run seed`, then `npm run dev`.
2. Open `/login` → sign in as `teacher@tagid.demo` / `Tagid123!`.
3. Dashboard shows stats; open **פעילויות → מסע היכרות עם בית הספר**.
4. **ניהול תגים** shows 5 tags + URLs + QR codes.
5. The seeded session is already **active** (`TAGID-1234`); open it under **מפגשים**.
6. In another browser/incognito open `/join` → enter `TAGID-1234` + a name → pick a group.
7. Open `/t/TAG-ENTRANCE` (simulates a tap) → see the station mission → submit → earn points.
8. Watch the **teacher live dashboard** update the group's progress and timeline.
9. Tap more tags (`/t/TAG-LIBRARY`, `/t/TAG-YARD`, …). The final station is
   **locked** until the previous one is completed.
10. Open `/student/leaderboard`, then **end the session** → view the **report**.

---

## 🗃️ Database Tables

`schools`, `profiles`, `classes`, `tags`, `activities`, `stations`, `missions`,
`sessions`, `groups`, `participants`, `station_progress`, `responses`, `events`,
`activity_templates`, `consents` — plus helper functions `add_group_score`,
`handle_new_user`, and RLS policies. See `supabase/schema.sql`.

---

## 🧩 Mission Types
`multiple_choice`, `open_text`, `yes_no`, `rating`, `group_reflection`,
`final_answer`, `knowledge_piece`.

---

## 🔌 What's Mocked / Next Steps
- **AI generator** (`src/lib/ai/activity-generator.ts`) returns mocked output —
  structured to drop in OpenAI/Gemini/Claude later (syllabus → stations/missions).
- **Realtime** uses polling (every 4s); swap to Supabase Realtime channels easily.
- **Super-admin / school-admin** screens: roles + RLS exist; dedicated admin UI is a next step.
- **Offline retry / PWA service worker**: manifest is present; add a SW for full offline.
- Optional: teacher manual grading UI for `requires_teacher_approval` missions.

---

## 📜 License
MIT.
