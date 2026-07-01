"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CheckSquare, LayoutDashboard, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_NAV = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Add", href: "/leads?new=1", icon: Plus, primary: true },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Reports", href: "/reports", icon: BarChart3 },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-ink-100 bg-white/95 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-10px_28px_-24px_rgba(16,24,40,0.45)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 items-end gap-1">
        {MOBILE_NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href.split("?")[0] + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition",
                item.primary
                  ? "mx-auto -mt-7 h-14 w-14 rounded-2xl bg-brand-600 text-white shadow-pop"
                  : active
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-500 hover:bg-ink-50 hover:text-ink-800",
              )}
            >
              <Icon className={cn(item.primary ? "h-6 w-6" : "h-5 w-5")} />
              {!item.primary && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
