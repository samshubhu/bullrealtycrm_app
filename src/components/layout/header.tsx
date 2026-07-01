"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Bell, LogOut, User, ChevronDown, Menu, X, Building2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ROLE_LABELS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { NAV, NAV_GROUPS } from "@/lib/nav";

interface Props {
  profile: { full_name: string; email: string; role: string };
  notifCount: number;
}

export function Header({ profile, notifCount }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setCreateOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function search(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  const quickLinks = [
    { label: "Lead", href: "/leads?new=1" },
    { label: "Contact", href: "/contacts" },
    { label: "Account", href: "/accounts" },
    { label: "Deal", href: "/deals" },
    { label: "Task", href: "/tasks" },
  ];

  return (
    <header className="h-14 border-b border-ink-100 bg-white flex items-center gap-2 px-3 shrink-0 md:gap-3 md:px-4">
      <button onClick={() => setNavOpen(true)} className="btn-ghost h-10 w-10 rounded-xl p-0 md:hidden" aria-label="Open navigation">
        <Menu className="h-5 w-5" />
      </button>

      <Link href="/search" className="btn-ghost h-10 w-10 rounded-xl p-0 sm:hidden" aria-label="Search">
        <Search className="h-5 w-5" />
      </Link>

      <form onSubmit={search} className="relative hidden max-w-md flex-1 sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search leads, contacts, deals, phone…"
          className="input h-10 rounded-xl border-transparent bg-ink-50 pl-9 md:h-9 md:rounded-lg"
        />
      </form>

      <div className="flex-1" />

      <div className="relative" ref={menuRef}>
        <button onClick={() => setCreateOpen((o) => !o)} className="btn-primary h-10 rounded-xl px-3 md:h-9 md:rounded-lg md:px-3.5">
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Create</span>
        </button>
        {createOpen && (
          <div className="absolute right-0 mt-2 w-44 card shadow-pop py-1.5 z-30">
            <p className="px-3 py-1 text-[10px] font-semibold uppercase text-ink-400">Quick create</p>
            {quickLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setCreateOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-50"
              >
                <Plus className="h-3.5 w-3.5 text-ink-400" /> New {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <Link href="/notifications" className="relative btn-ghost h-10 w-10 rounded-xl p-0">
        <Bell className="h-5 w-5" />
        {notifCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid place-items-center h-4 min-w-4 px-1 rounded-full bg-red-500 text-[10px] font-semibold text-white">
            {notifCount}
          </span>
        )}
      </Link>

      <ProfileMenu profile={profile} onSignOut={signOut} />
      {navOpen && <MobileNavDrawer onClose={() => setNavOpen(false)} />}
    </header>
  );
}

function MobileNavDrawer({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();

  return (
    <div className="fixed inset-0 z-[80] md:hidden">
      <div className="absolute inset-0 bg-ink-900/35" onClick={onClose} />
      <aside className="absolute inset-y-0 left-0 flex w-[86vw] max-w-sm flex-col bg-white shadow-pop">
        <div className="flex h-16 items-center justify-between border-b border-ink-100 px-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-ink-900">BullSales</p>
              <p className="text-[11px] text-ink-400">Realty CRM</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost h-10 w-10 rounded-xl p-0" aria-label="Close navigation">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group} className="mb-5">
              <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">{group}</p>
              <div className="space-y-1">
                {NAV.filter((item) => item.group === group).map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium",
                        active ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50",
                      )}
                    >
                      <Icon className={cn("h-5 w-5", active && "text-brand-600")} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </div>
  );
}

function ProfileMenu({
  profile,
  onSignOut,
}: {
  profile: { full_name: string; email: string; role: string };
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-lg p-1 hover:bg-ink-50">
        <Avatar name={profile.full_name} size="sm" />
        <ChevronDown className={cn("h-4 w-4 text-ink-400 transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 card shadow-pop z-30 overflow-hidden">
          <div className="px-4 py-3 border-b border-ink-100">
            <p className="text-sm font-semibold text-ink-900">{profile.full_name}</p>
            <p className="text-xs text-ink-400">{profile.email}</p>
            <span className="mt-1.5 inline-block badge bg-brand-50 text-brand-700">
              {ROLE_LABELS[profile.role] ?? profile.role}
            </span>
          </div>
          <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-ink-700 hover:bg-ink-50">
            <User className="h-4 w-4 text-ink-400" /> Profile settings
          </Link>
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
