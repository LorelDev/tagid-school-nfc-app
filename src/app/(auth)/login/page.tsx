import Link from "next/link";
import { login } from "../actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; redirect?: string };
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Link href="/" className="text-center text-2xl font-extrabold text-brand-dark">
        תגיד
      </Link>
      <h1 className="mt-6 text-2xl font-bold">כניסת מורה</h1>
      <p className="mt-1 text-sm text-slate-600">
        התחברו כדי לנהל פעילויות, תגים ומפגשים.
      </p>

      <form action={login} className="card mt-6 space-y-4">
        <input type="hidden" name="redirect" value={searchParams.redirect ?? ""} />
        <div>
          <label className="label" htmlFor="email">אימייל</label>
          <input id="email" name="email" type="email" required className="input" dir="ltr" />
        </div>
        <div>
          <label className="label" htmlFor="password">סיסמה</label>
          <input id="password" name="password" type="password" required className="input" dir="ltr" />
        </div>
        {searchParams.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {searchParams.error}
          </p>
        )}
        <button type="submit" className="btn-primary w-full">התחברות</button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        מורה חדש?{" "}
        <Link href="/signup" className="font-semibold text-brand">צרו חשבון</Link>
      </p>
    </main>
  );
}
