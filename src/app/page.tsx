import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 rounded-full bg-brand-light px-3 py-1 text-sm font-medium text-brand-dark">
        NFC Learning Platform
      </span>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Tagid
      </h1>
      <p className="mt-4 max-w-xl text-lg text-slate-600">
        Turn your school into an interactive learning trail. Teachers build
        missions, students tap NFC tags to play and learn — tracked live.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/dashboard" className="btn-primary">
          Teacher dashboard
        </Link>
        <Link href="/join" className="btn-secondary">
          Join a session
        </Link>
      </div>
    </main>
  );
}
