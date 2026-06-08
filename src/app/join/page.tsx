import { joinSession } from "./actions";

export default function JoinPage({
  searchParams,
}: {
  searchParams: { error?: string; code?: string; next?: string };
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-brand">Tagid</h1>
        <p className="mt-1 text-slate-600">Join your class session</p>
      </div>

      <form action={joinSession} className="card mt-6 space-y-4">
        <input type="hidden" name="next" value={searchParams.next ?? ""} />
        <div>
          <label className="label" htmlFor="join_code">Session code</label>
          <input
            id="join_code"
            name="join_code"
            required
            defaultValue={searchParams.code ?? ""}
            className="input text-center font-mono text-lg uppercase tracking-widest"
            placeholder="ABCDE"
            autoCapitalize="characters"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="label" htmlFor="display_name">Your name</label>
          <input id="display_name" name="display_name" required className="input" placeholder="e.g. Maya L." />
        </div>
        {searchParams.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {searchParams.error}
          </p>
        )}
        <button className="btn-primary w-full">Join</button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-500">
        Ask your teacher for the session code, then tap NFC tags around the room.
      </p>
    </main>
  );
}
