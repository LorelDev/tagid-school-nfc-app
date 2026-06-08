import Link from "next/link";
import { signup } from "../actions";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-bold">Create teacher account</h1>
      <p className="mt-1 text-sm text-slate-600">
        Build NFC learning trails for your class.
      </p>

      <form action={signup} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="full_name">Full name</label>
          <input id="full_name" name="full_name" type="text" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" minLength={6} required className="input" />
        </div>
        {searchParams.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {searchParams.error}
          </p>
        )}
        {searchParams.message && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {searchParams.message}
          </p>
        )}
        <button type="submit" className="btn-primary w-full">Create account</button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand">Sign in</Link>
      </p>
    </main>
  );
}
