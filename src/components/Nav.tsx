import Link from "next/link";
import { logout } from "@/app/(auth)/actions";

const links = [
  { href: "/dashboard", label: "סקירה", icon: "🏠" },
  { href: "/dashboard/activities", label: "פעילויות", icon: "🎯" },
  { href: "/dashboard/tags", label: "ניהול תגים", icon: "🏷️" },
  { href: "/dashboard/sessions", label: "מפגשים", icon: "⚡" },
  { href: "/dashboard/templates", label: "תבניות", icon: "📚" },
];

export function Nav({ name, school }: { name: string; school?: string }) {
  return (
    <aside className="border-l border-slate-200 bg-white sm:min-h-screen sm:w-60">
      <div className="flex items-center justify-between p-4 sm:block">
        <Link href="/dashboard" className="text-xl font-extrabold text-brand-dark">
          תגיד
        </Link>
        {school && <p className="hidden text-xs text-slate-500 sm:mt-1 sm:block">{school}</p>}
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 sm:flex-col sm:gap-0.5">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-brand-light hover:text-brand-dark"
          >
            <span aria-hidden>{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-slate-100 p-3 sm:absolute sm:bottom-0 sm:w-60">
        <p className="px-2 text-xs text-slate-500">{name}</p>
        <form action={logout}>
          <button className="btn-ghost mt-1 w-full justify-start text-sm">יציאה</button>
        </form>
      </div>
    </aside>
  );
}
