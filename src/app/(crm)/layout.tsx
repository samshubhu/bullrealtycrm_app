import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null);

  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          profile={{ full_name: profile.full_name, email: profile.email, role: profile.role }}
          notifCount={count ?? 0}
        />
        <main className="flex-1 overflow-y-auto bg-ink-50 p-3 pb-24 md:p-5 md:pb-5">{children}</main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
