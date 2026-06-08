import Link from "next/link";
import { signup } from "../actions";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Link href="/" className="text-center text-2xl font-extrabold text-brand-dark">
        תגיד
      </Link>
      <h1 className="mt-6 text-2xl font-bold">יצירת חשבון מורה</h1>
      <p className="mt-1 text-sm text-slate-600">בנו מסלולי למידה עם תגי NFC לכיתה שלכם.</p>

      <form action={signup} className="card mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="full_name">שם מלא</label>
          <input id="full_name" name="full_name" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="school_name">שם בית הספר</label>
          <input id="school_name" name="school_name" className="input" placeholder="בית ספר הדגמה תגיד" />
        </div>
        <div>
          <label className="label" htmlFor="email">אימייל</label>
          <input id="email" name="email" type="email" required className="input" dir="ltr" />
        </div>
        <div>
          <label className="label" htmlFor="password">סיסמה</label>
          <input id="password" name="password" type="password" minLength={6} required className="input" dir="ltr" />
        </div>
        {searchParams.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{searchParams.error}</p>
        )}
        {searchParams.message && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{searchParams.message}</p>
        )}
        <button type="submit" className="btn-primary w-full">יצירת חשבון</button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        כבר יש לכם חשבון?{" "}
        <Link href="/login" className="font-semibold text-brand">התחברות</Link>
      </p>
    </main>
  );
}
