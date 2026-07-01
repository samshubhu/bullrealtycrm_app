"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV, NAV_GROUPS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Building2, ChevronLeft } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("crm:sidebar-collapsed") === "1");
    } catch {}
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      try { localStorage.setItem("crm:sidebar-collapsed", next ? "1" : "0"); } catch {}
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-ink-100 bg-white transition-all duration-300 ease-out shrink-0",
        collapsed ? "w-[68px]" : "w-60",
      )}
    >
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-ink-100">
        <span className="grid place-items-center h-8 w-8 rounded-lg bg-brand-600 text-white shrink-0">
          <Building2 className="h-5 w-5" />
        </span>
        {!collapsed && (
          <div className="leading-tight">
            <p className="text-sm font-bold text-ink-900">BullSales</p>
            <p className="text-[10px] text-ink-400 -mt-0.5">Realty CRM</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-3 pb-5 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group}>
            {!collapsed && (
              <p className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                {group}
              </p>
            )}
            <div className="space-y-0.5">
              {NAV.filter((n) => n.group === group).map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
                      collapsed && "justify-center",
                    )}
                  >
                    <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-brand-600")} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <button
        onClick={toggleCollapsed}
        className={cn(
          "flex min-h-11 items-center gap-2 border-t border-ink-100 px-4 py-2.5 text-xs text-ink-500 hover:bg-ink-50",
          collapsed && "justify-center",
        )}
      >
        <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", collapsed && "rotate-180")} />
        {!collapsed && "Collapse"}
      </button>
    </aside>
  );
}
