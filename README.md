# Tagid – NFC-based Interactive Learning Platform for Schools

Tagid turns physical spaces (classrooms, hallways, science labs, museums) into
interactive learning trails. Teachers build **activities** made of **missions**,
attach each mission to a **physical NFC tag**, and students tap their phones on
the tags to receive missions, submit answers, and earn points — all tracked live
on a teacher dashboard.

> **Tagid** (תגיד) is a play on the Hebrew "תג" (tag) — _"tap a tag, tell what you
> learned."_

---

## ✨ Features

- **Roles & auth** — teacher and student roles backed by Supabase Auth.
- **Teacher dashboard** — manage classes, activities, sessions, and reports.
- **Activity builder** — create an activity, add ordered missions with question
  types and point values.
- **NFC tag management** — generate tags, bind them to missions, and print the
  URL/QR that gets written to the physical tag.
- **NFC tag resolver** — tapping a tag opens `/t/<code>` which resolves to the
  right mission for the active session.
- **Student join flow** — students join a live session with a short code, no app
  install required.
- **Mission submission & scoring** — answers are validated and scored
  automatically (with manual override for open questions).
- **Live session dashboard** — real-time view of who tapped what and current
  scores.
- **Reports & demo data** — per-student and per-mission reports, plus a seed
  script with realistic demo data.

---

## 🧱 Tech Stack

| Layer      | Tech                                              |
| ---------- | ------------------------------------------------- |
| Framework  | Next.js 14 (App Router) + TypeScript              |
| Styling    | Tailwind CSS                                       |
| Database   | Supabase (PostgreSQL)                             |
| Auth       | Supabase Auth (`@supabase/ssr`)                  |
| Hosting    | Vercel (recommended) — any Node host works        |

---

## 📁 Folder Structure

```
tagid-school-nfc-app/
├── README.md
├── .env.example                # copy to .env.local
├── package.json
├── next.config.mjs
├── tailwind.config.ts
├── supabase/
│   ├── schema.sql              # tables, RLS policies, triggers
│   └── seed.sql                # demo data
├── scripts/
│   └── seed.mjs                # programmatic demo-data seeder
└── src/
    ├── app/                    # Next.js App Router routes
    │   ├── (auth)/             # login / signup
    │   ├── dashboard/          # teacher dashboard
    │   ├── join/               # student join flow
    │   ├── t/[code]/           # NFC tag resolver route
    │   └── api/                # route handlers
    ├── components/             # shared UI
    └── lib/                    # supabase clients, types, scoring
```

---

## 🚀 Getting Started (local)

### 1. Clone & install

```bash
git clone https://github.com/LorelDev/tagid-school-nfc-app.git
cd tagid-school-nfc-app
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# then edit .env.local with your Supabase project values
```

### 3. Set up Supabase (see section below), then run

```bash
npm run dev
# open http://localhost:3000
```

---

## 🗄️ Supabase Setup

1. Create a free project at <https://supabase.com>.
2. In **Project Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret)
3. Open the **SQL Editor** and run, in order:
   - `supabase/schema.sql`
   - `supabase/seed.sql` _(optional demo data)_
4. (Optional) Seed programmatically instead:
   ```bash
   node scripts/seed.mjs
   ```

The schema enables Row Level Security so teachers only see their own data and
students only see the session they joined.

---

## 📲 Writing the Generated URLs to Physical NFC Tags

Each NFC tag in Tagid maps to a short code. The teacher dashboard shows the full
URL to write, e.g.:

```
https://your-app.com/t/AB12CD
```

### Recommended hardware
- **NTAG215 / NTAG213** stickers (cheap, widely supported, ~500+ bytes).

### Option A — Phone (easiest)
1. Install **NFC Tools** (iOS / Android) or **NXP TagWriter** (Android).
2. Open the app → **Write** → **Add a record** → **URL/URI**.
3. Paste the tag URL from the dashboard (`https://your-app.com/t/AB12CD`).
4. Tap **Write**, then hold the tag to the back of the phone.
5. Verify by tapping again — your phone should open the URL.

### Option B — USB NFC reader/writer
- Use an **ACR122U** reader with `nfc-tools` / `libnfc`, or the vendor app, and
  write an NDEF URI record containing the same URL.

### Tips
- Write the URL as an **NDEF URI record** (not plain text) so phones auto-open it.
- Optionally **lock** the tag after writing to make it read-only.
- Print the matching QR code (also shown in the dashboard) as a fallback for
  devices without NFC.

---

## 🧪 Demo Accounts

After running `seed.sql` / `seed.mjs`:

| Role    | Email                | Password    |
| ------- | -------------------- | ----------- |
| Teacher | `teacher@tagid.demo` | `Tagid123!` |

Students join without an account using the session code shown on the dashboard.

---

## 📜 License

MIT — see `LICENSE`.
