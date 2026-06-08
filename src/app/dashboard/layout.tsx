import { requireProfile } from "@/lib/auth";
import { Nav } from "@/components/Nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  return (
    <div className="min-h-screen bg-slate-50">
      <Nav name={profile.full_name || "Teacher"} />
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </div>
  );
}
