import Link from "next/link";
import { logout } from "@/app/(auth)/actions";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/activities", label: "Activities" },
  { href: "/dashboard/tags", label: "NFC Tags" },
  { href: "/dashboard/sessions", label: "Sessions" },
];

export function Nav({ name }: { name: string }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-bold text-brand">
            Tagid
          </Link>
          <nav className="hidden gap-1 sm:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:inline">{name}</span>
          <form action={logout}>
            <button className="btn-secondary py-1.5 text-sm">Sign out</button>
          </form>
        </div>
      </div>
    </header>
  );
}
