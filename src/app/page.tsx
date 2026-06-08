import Link from "next/link";

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      {/* hero */}
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-light via-white to-accent-light/40" />
        <span className="chip bg-white text-brand-dark shadow-sm">
          NFC · QR · למידה חברתית
        </span>
        <h1 className="mt-5 text-6xl font-extrabold tracking-tight text-brand-dark">
          תגיד
        </h1>
        <p className="mt-3 text-2xl font-bold text-slate-800">
          לגעת. לגלות. להגיד.
        </p>
        <p className="mt-4 max-w-xl text-lg text-slate-600">
          הופכים את בית הספר למרחב למידה אינטראקטיבי. תלמידים נוגעים בתגי NFC
          ברחבי בית הספר, מקבלים משימות, פותרים יחד ומתקדמים בין תחנות.
        </p>

        <div className="mt-8 grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href="/join" className="btn-accent py-4 text-base">
            כניסת תלמידים
          </Link>
          <Link href="/login" className="btn-primary py-4 text-base">
            כניסת מורה
          </Link>
        </div>

        <div className="mt-12 grid w-full gap-4 sm:grid-cols-3">
          {[
            { t: "סורקים תג", d: "נוגעים בתג NFC או סורקים QR ונכנסים מיד לפעילות." },
            { t: "פותרים משימה", d: "שאלות, רפלקציה, חידות וחדרי בריחה — בקבוצות." },
            { t: "מתקדמים יחד", d: "תחנות נפתחות, ניקוד קבוצתי ולוח התקדמות חי." },
          ].map((f) => (
            <div key={f.t} className="card text-right">
              <h3 className="font-bold text-slate-800">{f.t}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.d}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-slate-500">
          הופכים את בית הספר למרחב למידה אינטראקטיבי.
        </p>
        <div className="mt-4 flex gap-4 text-xs text-slate-400">
          <Link href="/privacy" className="hover:underline">פרטיות</Link>
          <Link href="/terms" className="hover:underline">תנאי שימוש</Link>
        </div>
      </div>
    </main>
  );
}
