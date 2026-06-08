import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/Nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const supabase = createClient();
  let schoolName = "";
  if (profile.school_id) {
    const { data } = await supabase
      .from("schools")
      .select("name")
      .eq("id", profile.school_id)
      .single();
    schoolName = data?.name ?? "";
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 sm:flex-row">
      <Nav name={profile.full_name || "מורה"} school={schoolName} />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-5 py-8">{children}</div>
      </main>
    </div>
  );
}
