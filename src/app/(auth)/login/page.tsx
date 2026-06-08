import Link from "next/link";
import { login } from "../actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; redirect?: string };
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-bold">Teacher login</h1>
      <p className="mt-1 text-sm text-slate-600">
        Sign in to manage activities and sessions.
      </p>

      <form action={login} className="mt-6 space-y-4">
        <input type="hidden" name="redirect" value={searchParams.redirect ?? ""} />
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required className="input" />
        </div>
        {searchParams.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {searchParams.error}
          </p>
        )}
        <button type="submit" className="btn-primary w-full">Sign in</button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        New teacher?{" "}
        <Link href="/signup" className="font-medium text-brand">Create an account</Link>
      </p>
    </main>
  );
}
