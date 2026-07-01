"use client";

import { useState, useRef, useEffect } from "react";
import { Star, Download, Pencil, Plus, X, Search, HelpCircle, LayoutGrid, Check, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChartWidget } from "@/components/charts/chart-widget";

type DashKind = "essentials" | "sales" | "activities" | "custom";
interface DashTab { id: string; name: string; kind: DashKind; curated?: boolean }

const DEFAULT_TABS: DashTab[] = [
  { id: "essentials", name: "Sales Essentials Dashboard", kind: "essentials", curated: true },
  { id: "sales", name: "Sales Dashboard", kind: "sales", curated: true },
  { id: "activities", name: "Activities Dashboard", kind: "activities", curated: true },
];

// Curated dashboards that can be (re)added from the "+" menu.
const CURATED: { name: string; kind: DashKind; id: string }[] = [
  { name: "Sales Essentials Dashboard", kind: "essentials", id: "essentials" },
  { name: "Sales Dashboard", kind: "sales", id: "sales" },
  { name: "Activities Dashboard", kind: "activities", id: "activities" },
];

const REPORT_OPTIONS = [
  "Chat Dashboard", "Ecommerce Marketing Journey Report", "Product Dashboard",
  "Team activity report", "Sales Trends", "Sales Forecast", "Contact generation and trends",
];

const BOTTOM_TABS = ["Summary", "Deals", "Contacts", "Sales activities", "Revenue breakdown"];

// Each bottom tab is a report "page" with its own relevant widget set.
const BOTTOM_SETS: Record<string, string[]> = {
  Deals: ["open_by_stage", "pipeline_by_stage", "deals_by_stage", "forecast_by_stage", "win_loss", "revenue_won_by_source", "revenue_by_project", "matrix_project_stage"],
  Contacts: ["contacts_by_owner", "contacts_by_type", "contacts_over_time", "leads_by_source", "leads_by_owner", "matrix_source_status"],
  "Sales activities": ["activities_over_time", "calls_by_status", "calls_by_user", "whatsapp_by_status", "tasks_by_status", "tasks_by_owner", "site_visits_by_status"],
  "Revenue breakdown": ["kpi_revenue_won", "kpi_revenue_lost", "revenue_won_by_source", "revenue_by_project", "forecast_by_stage", "quota_vs_achievement", "matrix_project_stage"],
};

const LAYOUT_VERSION = "3";

export function DashboardTabs({ data }: { data: any }) {
  const catalog: any[] = data.catalog;
  const catalogMap: Record<string, any> = Object.fromEntries(catalog.map((w) => [w.id, w]));
  const categories: { name: string; ids: string[] }[] = data.categories;

  const [tabs, setTabs] = useState<DashTab[]>(DEFAULT_TABS);
  const [active, setActive] = useState("essentials");
  const [bottom, setBottom] = useState("Summary");
  const [editing, setEditing] = useState(false);
  const current = tabs.find((t) => t.id === active);

  function closeTab(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (active === id && next.length) setActive(next[0].id);
      return next;
    });
  }
  function addTab(name: string, kind: DashKind, id?: string) {
    const newId = id ?? "custom-" + Date.now();
    if (tabs.some((t) => t.id === newId)) { setActive(newId); setBottom("Summary"); return; }
    setTabs((prev) => [...prev, { id: newId, name, kind, curated: kind !== "custom" }]);
    setActive(newId);
    setBottom("Summary");
  }
  function restoreDefaults() {
    setTabs(DEFAULT_TABS);
    setActive("essentials");
    setBottom("Summary");
  }

  const defaultIdsFor = (t: DashTab, b: string) => {
    if (b === "Summary") return t.kind === "custom" ? [] : (data.boards[t.kind] as string[]);
    return BOTTOM_SETS[b] ?? [];
  };

  const updated = new Date(data.updatedAt).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  function exportDashboard() {
    if (!current) return;
    const ids = defaultIdsFor(current, bottom);
    const rows: string[][] = [["Dashboard", current.name], ["Report tab", bottom], [], ["Widget", "Name", "Value"]];
    ids.forEach((id) => {
      const widget = catalogMap[id];
      if (!widget) return;
      if (widget.kind === "grouped" && widget.groupedKeys) {
        rows.push([widget.title, "Name", ...widget.groupedKeys.map((k: any) => k.label)]);
        widget.data.forEach((row: any) => rows.push(["", row.name, ...widget.groupedKeys.map((k: any) => String(row[k.key] ?? 0))]));
      } else {
        widget.data.forEach((row: any) => rows.push([widget.title, row.name, String(row.value ?? widget.kpi?.value ?? 0)]));
      }
    });
    downloadRows(rows, `${current.name}-${bottom}.csv`);
  }

  return (
    <div className="-m-3 flex h-[calc(100vh-3.5rem)] min-h-0 flex-col overflow-hidden bg-white md:-m-5">
      <div className="shrink-0 border-b border-[#d9e2ec] bg-white px-4 py-3 md:px-5">
        <h1 className="text-xl font-semibold text-[#092f4f]">Dashboards</h1>
      </div>

      {/* Dashboard tabs — scroll area + external "+" so its menu never gets clipped */}
      <div className="flex shrink-0 items-stretch gap-0 border-b border-[#cfdbe7] bg-[#f4f7fa] px-3 md:px-5">
        <div className="flex min-w-0 items-stretch overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => { setActive(t.id); setBottom("Summary"); }}
              className={cn("group flex items-center gap-2 border-x border-transparent px-3 py-3 text-sm font-medium whitespace-nowrap transition md:px-4",
                active === t.id ? "border-[#cfdbe7] bg-white text-[#0b4f8a]" : "text-[#29465f] hover:bg-white/70 hover:text-[#092f4f]")}>
              <span className="max-w-[150px] truncate md:max-w-[180px]">{t.name}</span>
              <span onClick={(e) => closeTab(t.id, e)} className="opacity-50 hover:opacity-100 hover:text-red-500"><X className="h-3.5 w-3.5" /></span>
            </button>
          ))}
        </div>
        <AddReportMenu present={new Set(tabs.map((t) => t.id))} onAdd={addTab} />
      </div>

      {!current ? (
        <NoTabs onRestore={restoreDefaults} />
      ) : (
        <>
          {/* Sub-header */}
          <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-[#d9e2ec] bg-white px-4 py-3 md:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <h2 className="min-w-0 truncate text-base font-semibold text-[#092f4f]">{current.name}</h2>
              {current.curated && <span className="rounded border border-brand-200 bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">Curated</span>}
              <button title="Favorite dashboard" className="text-ink-300 hover:text-amber-400"><Star className="h-4 w-4" /></button>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-2 md:gap-3">
              <span className="text-xs font-semibold text-[#092f4f]">Data Updated:</span>
              <span className="text-xs text-ink-600">{updated}</span>
              <button title="Dashboard help" className="hidden text-ink-300 hover:text-ink-500 sm:grid"><HelpCircle className="h-4 w-4" /></button>
              <button onClick={exportDashboard} className="btn-outline h-8 rounded border-[#c8d6e3]"><Download className="h-4 w-4" /> Export</button>
              <button onClick={() => setEditing((value) => !value)} className={cn("h-8 rounded px-3 text-sm font-medium transition inline-flex items-center gap-2", editing ? "border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100" : "btn-primary")}>
                {editing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                {editing ? "Done" : "Edit"}
              </button>
            </div>
          </div>

          {/* Board for the active dashboard report page */}
          <div className="min-h-0 flex-1 overflow-y-auto bg-[#f4f7fa] px-3 py-3 pb-6 md:px-5">
            <Board
              key={`${current.id}::${bottom}`}
              tabId={`${current.id}::${bottom}`}
              defaultIds={defaultIdsFor(current, bottom)}
              catalogMap={catalogMap}
              categories={categories}
              isEditing={editing}
            />
          </div>

          <div className="mb-20 shrink-0 overflow-x-auto border-t border-[#cfdbe7] bg-white shadow-[0_-8px_20px_-18px_rgba(16,24,40,0.55)] md:mb-0">
            <div className="flex min-w-max items-stretch">
              {BOTTOM_TABS.map((b) => (
                <button
                  key={b}
                  onClick={() => setBottom(b)}
                  className={cn(
                    "relative flex h-11 min-w-[112px] items-center justify-center border-r border-[#d9e2ec] px-4 text-sm font-semibold transition whitespace-nowrap md:min-w-[86px]",
                    bottom === b
                      ? "bg-white text-brand-700"
                      : "bg-[#f8fafc] text-[#29465f] hover:bg-white hover:text-[#092f4f]",
                  )}
                >
                  {bottom === b && <span className="absolute inset-x-0 top-0 h-0.5 bg-brand-600" />}
                  <span className="max-w-[136px] truncate">{b}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NoTabs({ onRestore }: { onRestore: () => void }) {
  return (
    <div className="flex-1 bg-ink-50 grid place-items-center px-5">
      <div className="card text-center py-16 px-10 max-w-md">
        <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600"><LayoutDashboard className="h-6 w-6" /></span>
        <p className="font-medium text-ink-800">No dashboards open</p>
        <p className="text-sm text-ink-400 mt-1">Restore the curated dashboards, or add a new report from the <span className="font-medium">+</span> button above.</p>
        <button onClick={onRestore} className="btn-primary mt-4 mx-auto"><Plus className="h-4 w-4" /> Restore default dashboards</button>
      </div>
    </div>
  );
}

function downloadRows(rows: string[][], filename: string) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.replace(/[^\w.-]+/g, "_").toLowerCase();
  link.click();
  URL.revokeObjectURL(url);
}

/* ---------------- Board (widget-list driven, persisted) ---------------- */

function Board({ tabId, defaultIds, catalogMap, categories, isEditing }: {
  tabId: string;
  defaultIds: string[];
  catalogMap: Record<string, any>;
  categories: { name: string; ids: string[] }[];
  isEditing: boolean;
}) {
  const storeKey = `dash:board:${tabId}`;
  const sizeKey = `dash:board:${tabId}:sizes`;
  const layoutVersionKey = `dash:board:${tabId}:layout-version`;
  const [ids, setIds] = useState<string[]>(defaultIds);
  const [sizes, setSizes] = useState<Record<string, WidgetSize>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storeKey);
      const savedIds = saved ? JSON.parse(saved) as string[] : defaultIds;
      const savedSizes = localStorage.getItem(sizeKey);
      const shouldOptimize = localStorage.getItem(layoutVersionKey) !== LAYOUT_VERSION;
      const nextIds = shouldOptimize ? optimizeIds(savedIds, catalogMap) : savedIds;
      const nextSizes = shouldOptimize ? recommendedSizes(nextIds, catalogMap) : (savedSizes ? JSON.parse(savedSizes) : {});
      setIds(nextIds);
      setSizes(nextSizes);
      if (shouldOptimize) {
        localStorage.setItem(storeKey, JSON.stringify(nextIds));
        localStorage.setItem(sizeKey, JSON.stringify(nextSizes));
        localStorage.setItem(layoutVersionKey, LAYOUT_VERSION);
      }
    } catch {}
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabId]);

  function persist(next: string[]) {
    setIds(next);
    try { localStorage.setItem(storeKey, JSON.stringify(next)); } catch {}
  }
  function persistSize(id: string, size: WidgetSize) {
    setSizes((prev) => {
      const next = { ...prev, [id]: size };
      try { localStorage.setItem(sizeKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }
  function moveWidget(fromId: string, toId: string) {
    if (fromId === toId) return;
    persist(reorder(ids, fromId, toId));
  }
  const remove = (id: string) => persist(ids.filter((x) => x !== id));
  const add = (id: string) => { if (!ids.includes(id)) persist([...ids, id]); };
  const reset = () => {
    try {
      localStorage.removeItem(storeKey);
      localStorage.removeItem(sizeKey);
      localStorage.removeItem(layoutVersionKey);
    } catch {}
    const nextIds = optimizeIds(defaultIds, catalogMap);
    const nextSizes = recommendedSizes(nextIds, catalogMap);
    persist(nextIds);
    setSizes(nextSizes);
    try {
      localStorage.setItem(sizeKey, JSON.stringify(nextSizes));
      localStorage.setItem(layoutVersionKey, LAYOUT_VERSION);
    } catch {}
  };

  if (!loaded) return null;

  if (!ids.length) {
    return (
      <>
        <div className="card grid place-items-center text-center py-24">
          <div>
            <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600"><LayoutGrid className="h-6 w-6" /></span>
            <p className="font-medium text-ink-800">No widgets yet</p>
            <p className="text-sm text-ink-400 mt-1 max-w-sm">Add report widgets to start tracking your sales, leads and revenue.</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button onClick={() => setAdding(true)} className="btn-primary"><Plus className="h-4 w-4" /> Add widget</button>
              {defaultIds.length > 0 && <button onClick={reset} className="btn-outline">Restore defaults</button>}
            </div>
          </div>
        </div>
        {adding && <AddWidgetModal categories={categories} catalogMap={catalogMap} present={new Set(ids)} onAdd={add} onClose={() => setAdding(false)} />}
      </>
    );
  }

  return (
    <>
      <div className="grid grid-flow-dense grid-cols-1 gap-4 auto-rows-[220px] transition-[grid-template-columns] duration-300 ease-out md:grid-cols-2 xl:grid-cols-4">
        {ids.map((id) => {
          const def = catalogMap[id];
          if (!def) return null;
          const size = sizes[id] ?? defaultSizeFor(def);
          return (
            <ChartWidget key={id} id={`${tabId}:${def.id}`} title={def.title} data={def.data} kind={def.kind}
              defaultType={def.defaultType} types={def.types} groupedKeys={def.groupedKeys} underlyingData={def.underlyingData} format={def.format} kpi={def.kpi}
              className={cn(spanClass(size.cols), rowClass(size.rows), dropTargetId === id && "ring-2 ring-brand-400 ring-offset-2")}
              chartHeight={chartHeightFor(size.rows)}
              size={isEditing ? size : undefined}
              onResize={isEditing ? (next) => persistSize(id, next) : undefined}
              onMoveStart={isEditing ? (event) => {
                setDraggingId(id);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", id);
              } : undefined}
              onMoveOver={(event) => {
                if (!draggingId || draggingId === id) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDropTargetId(id);
              }}
              onMoveDrop={(event) => {
                event.preventDefault();
                const fromId = event.dataTransfer.getData("text/plain") || draggingId;
                if (fromId) moveWidget(fromId, id);
                setDraggingId(null);
                setDropTargetId(null);
              }}
              onMoveEnd={() => {
                setDraggingId(null);
                setDropTargetId(null);
              }}
              onRemove={isEditing ? () => remove(id) : undefined} />
          );
        })}
        {isEditing && (
          <button onClick={() => setAdding(true)}
            className="card border-dashed border-2 border-ink-200 bg-transparent grid place-items-center text-ink-400 hover:text-brand-600 hover:border-brand-300 transition min-h-[210px]">
            <span className="flex flex-col items-center gap-1.5"><Plus className="h-6 w-6" /><span className="text-sm font-medium">Add widget</span></span>
          </button>
        )}
      </div>
      {adding && <AddWidgetModal categories={categories} catalogMap={catalogMap} present={new Set(ids)} onAdd={add} onClose={() => setAdding(false)} />}
    </>
  );
}

type WidgetSize = { cols: number; rows: number };

function defaultSizeFor(def: any): WidgetSize {
  return recommendedSizeFor(def);
}

function chartHeightFor(rows: number) {
  return rows === 1 ? 170 : rows === 2 ? 420 : 650;
}

function spanClass(cols: number) {
  if (cols === 4) return "md:col-span-2 xl:col-span-4";
  if (cols === 3) return "md:col-span-2 xl:col-span-3";
  if (cols === 2) return "md:col-span-2";
  return "";
}

function rowClass(rows: number) {
  if (rows === 3) return "row-span-3";
  if (rows === 2) return "row-span-2";
  return "row-span-1";
}

function reorder(items: string[], fromId: string, toId: string) {
  const from = items.indexOf(fromId);
  const to = items.indexOf(toId);
  if (from < 0 || to < 0) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function optimizeIds(ids: string[], catalogMap: Record<string, any>) {
  return [...ids].sort((a, b) => {
    const aDef = catalogMap[a];
    const bDef = catalogMap[b];
    const groupDiff = layoutGroup(aDef) - layoutGroup(bDef);
    if (groupDiff !== 0) return groupDiff;
    return ids.indexOf(a) - ids.indexOf(b);
  });
}

function recommendedSizes(ids: string[], catalogMap: Record<string, any>) {
  return Object.fromEntries(ids.map((id) => [id, recommendedSizeFor(catalogMap[id])]));
}

function recommendedSizeFor(def: any): WidgetSize {
  if (!def) return { cols: 1, rows: 1 };
  if (def.kind === "kpi") return { cols: 1, rows: 1 };
  const columnCount = (def.groupedKeys?.length ?? 0) + 1;
  const rowCount = def.data?.length ?? 0;
  if (def.defaultType === "table" || def.id?.startsWith("matrix_")) {
    if (columnCount >= 5) return { cols: 4, rows: Math.min(3, Math.max(2, Math.ceil((rowCount + 1) / 4))) };
    return { cols: columnCount <= 2 ? 2 : 3, rows: rowCount <= 3 ? 1 : 2 };
  }
  if (def.kind === "grouped") {
    return { cols: columnCount <= 2 && rowCount <= 3 ? 2 : 3, rows: rowCount <= 3 ? 1 : 2 };
  }
  if (def.w === 2 || ["funnel", "line", "area", "grouped", "stacked"].includes(def.defaultType)) {
    return { cols: 2, rows: 1 };
  }
  if ((def.data?.length ?? 0) > 8) return { cols: 2, rows: 1 };
  return { cols: 1, rows: 1 };
}

function layoutGroup(def: any) {
  if (!def) return 9;
  if (def.kind === "kpi") return 0;
  if (def.defaultType === "funnel" || def.id?.includes("pipeline") || def.id?.includes("forecast") || def.id?.includes("quota")) return 1;
  if (def.kind === "grouped" || def.defaultType === "table" || def.id?.startsWith("matrix_")) return 3;
  return 2;
}

/* ---------------- Add widget modal (catalog library) ---------------- */

function AddWidgetModal({ categories, catalogMap, present, onAdd, onClose }: {
  categories: { name: string; ids: string[] }[];
  catalogMap: Record<string, any>;
  present: Set<string>;
  onAdd: (id: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const term = q.toLowerCase();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl card shadow-pop flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
          <h2 className="text-base font-semibold text-ink-900">Add widget</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-5 pt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search widgets…" className="input pl-9" autoFocus />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {categories.map((cat) => {
            const items = cat.ids.map((id) => catalogMap[id]).filter((w) => w && w.title.toLowerCase().includes(term));
            if (!items.length) return null;
            return (
              <div key={cat.name}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-2">{cat.name}</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {items.map((w) => {
                    const added = present.has(w.id);
                    return (
                      <button key={w.id} onClick={() => onAdd(w.id)} disabled={added}
                        className={cn("flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition",
                          added ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-ink-200 hover:border-brand-300 hover:bg-brand-50 text-ink-700")}>
                        <span className="truncate">{w.title}</span>
                        {added ? <Check className="h-4 w-4 shrink-0" /> : <Plus className="h-4 w-4 shrink-0 text-ink-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-ink-100 px-5 py-3 flex justify-end">
          <button onClick={onClose} className="btn-primary">Done</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Add-report dropdown (adds a dashboard tab) ---------------- */

function AddReportMenu({ present, onAdd }: { present: Set<string>; onAdd: (name: string, kind: DashKind, id?: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  const t = q.toLowerCase();
  const curated = CURATED.filter((c) => c.name.toLowerCase().includes(t));
  const reports = REPORT_OPTIONS.filter((r) => r.toLowerCase().includes(t));

  return (
    <div className="relative shrink-0" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} title="Add dashboard" className="grid place-items-center h-8 w-8 rounded-lg text-ink-500 hover:bg-ink-100 hover:text-brand-600">
        <Plus className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute left-0 top-10 w-72 card shadow-pop z-40 overflow-hidden">
          <div className="px-3 pt-3 pb-2">
            <p className="text-sm font-semibold text-ink-800 mb-2">Add a dashboard</p>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search report" className="input h-9 pl-8" autoFocus />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto pb-1">
            {curated.length > 0 && (
              <>
                <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Curated dashboards</p>
                {curated.map((c) => {
                  const added = present.has(c.id);
                  return (
                    <button key={c.id} onClick={() => { onAdd(c.name, c.kind, c.id); setOpen(false); setQ(""); }}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-ink-700 hover:bg-brand-50 hover:text-brand-700">
                      <span className="truncate">{c.name}</span>
                      {added ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <LayoutDashboard className="h-4 w-4 text-ink-300 shrink-0" />}
                    </button>
                  );
                })}
              </>
            )}
            {reports.length > 0 && (
              <>
                <p className="px-3 py-1 mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Popular reports</p>
                {reports.map((r) => (
                  <button key={r} onClick={() => { onAdd(r, "custom"); setOpen(false); setQ(""); }}
                    className="w-full text-left px-3 py-2 text-sm text-ink-700 hover:bg-brand-50 hover:text-brand-700 truncate">{r}</button>
                ))}
              </>
            )}
            {!curated.length && !reports.length && <p className="px-3 py-3 text-sm text-ink-400">No matching report</p>}
          </div>
        </div>
      )}
    </div>
  );
}

