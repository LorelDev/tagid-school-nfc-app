import Link from "next/link";
import { joinSession } from "./actions";

export default function JoinPage({
  searchParams,
}: {
  searchParams: { error?: string; code?: string; next?: string };
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="text-center">
        <Link href="/" className="text-3xl font-extrabold text-brand-dark">תגיד</Link>
        <p className="mt-1 text-slate-600">כניסת תלמידים</p>
      </div>

      <form action={joinSession} className="card mt-6 space-y-4">
        <input type="hidden" name="next" value={searchParams.next ?? ""} />
        <div>
          <label className="label" htmlFor="session_code">קוד פעילות</label>
          <input
            id="session_code"
            name="session_code"
            required
            defaultValue={searchParams.code ?? ""}
            className="input text-center font-mono text-lg uppercase tracking-widest"
            placeholder="TAGID-1234"
            autoCapitalize="characters"
            autoComplete="off"
            dir="ltr"
          />
        </div>
        <div>
          <label className="label" htmlFor="display_name">השם שלי</label>
          <input id="display_name" name="display_name" required className="input" placeholder="מאיה ל." />
        </div>
        {searchParams.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{searchParams.error}</p>
        )}
        <button className="btn-accent w-full py-3 text-base">כניסה לפעילות</button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-500">
        בקשו מהמורה את קוד הפעילות, ואז געו בתגים ברחבי בית הספר.
      </p>
    </main>
  );
}
