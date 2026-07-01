"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Check, ChevronDown, Download, Edit3, Filter, Grid3X3, Layers3, Link2, ListFilter, MoreHorizontal, Plus,
  Search, SlidersHorizontal, Table2, Trash2, X,
} from "lucide-react";
import { LeadForm } from "./lead-form";
import { DEFAULT_LEAD_VIEW_IDS, LEAD_VIEWS, getLeadView } from "./lead-views";
import { LEAD_STATUS, LEAD_STATUS_ORDER } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { LeadGroupBy, LeadTableMode } from "./leads-list-shell";

interface Option { id: string; name: string }
interface ViewFilters {
  status?: string;
  priority?: string;
  source?: string;
  project?: string;
  owner?: string;
}
interface CustomView {
  id: string;
  label: string;
  filters: ViewFilters;
  mode: LeadTableMode;
  groupBy: LeadGroupBy;
  density: "compact" | "comfortable";
  count: number;
}

export function LeadsToolbar({
  sources, projects, owners, openNew, viewCounts, mode, groupBy, selectedCount,
  onModeChange, onGroupByChange, onCustomize, onSelectAll, onClearSelection,
  onBulkUpdate,
}: {
  sources: Option[];
  projects: Option[];
  owners: { id: string; full_name: string }[];
  openNew?: boolean;
  viewCounts: Record<string, number>;
  mode: LeadTableMode;
  groupBy: LeadGroupBy;
  selectedCount: number;
  onModeChange: (mode: LeadTableMode) => void;
  onGroupByChange: (groupBy: LeadGroupBy) => void;
  onCustomize: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkUpdate: (patch: Record<string, any>) => Promise<void>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(!!openNew);
  const [term, setTerm] = useState(params.get("q") ?? "");
  const [tabIds, setTabIds] = useState<string[]>(DEFAULT_LEAD_VIEW_IDS);
  const [customViews, setCustomViews] = useState<CustomView[]>([]);
  const [actionNote, setActionNote] = useState("");
  const [bulkEditor, setBulkEditor] = useState<"status" | "owner" | "tag" | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingView, setEditingView] = useState<CustomView | null>(null);
  const currentViewId = params.get("view") ?? "all";
  const currentView = getLeadView(params.get("view"));

  useEffect(() => {
    try {
      const saved = localStorage.getItem("leads:visible-views");
      const savedCustom = localStorage.getItem("leads:custom-views");
      if (savedCustom) {
        const parsed = JSON.parse(savedCustom) as Partial<CustomView>[];
        setCustomViews(parsed.map((view) => ({
          id: view.id ?? `custom-${Date.now()}`,
          label: view.label ?? "Untitled view",
          filters: view.filters ?? {},
          mode: view.mode ?? "table",
          groupBy: view.groupBy ?? "status",
          density: view.density ?? "comfortable",
          count: view.count ?? 0,
        })));
      }
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        setTabIds(["all", "my", ...parsed.filter((id) => id !== "all" && id !== "my")]);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      updateParams({ q: term || null });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  function updateParams(patch: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([key, value]) => {
      value ? sp.set(key, value) : sp.delete(key);
    });
    router.replace(`${pathname}?${sp.toString()}`);
  }

  function persistTabs(next: string[]) {
    try { localStorage.setItem("leads:visible-views", JSON.stringify(next)); } catch {}
  }

  function persistCustomViews(next: CustomView[]) {
    try { localStorage.setItem("leads:custom-views", JSON.stringify(next)); } catch {}
  }

  function applyCustomView(view: CustomView) {
    updateParams({
      view: view.id,
      status: view.filters.status || null,
      priority: view.filters.priority || null,
      source: view.filters.source || null,
      project: view.filters.project || null,
      owner: view.filters.owner || null,
      density: view.density,
    });
    onGroupByChange(view.groupBy);
    onModeChange(view.mode);
  }

  function chooseView(id: string) {
    const custom = customViews.find((view) => view.id === id);
    if (custom) {
      applyCustomView(custom);
      return;
    }
    updateParams({ view: id === "all" ? null : id });
  }

  function addView(id: string) {
    setTabIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      persistTabs(next);
      return next;
    });
    chooseView(id);
  }

  function saveCustomView(view: CustomView) {
    setCustomViews((prev) => {
      const next = prev.some((item) => item.id === view.id)
        ? prev.map((item) => item.id === view.id ? view : item)
        : [...prev, view];
      persistCustomViews(next);
      return next;
    });
    setTabIds((prev) => {
      if (prev.includes(view.id)) return prev;
      const next = [...prev, view.id];
      persistTabs(next);
      return next;
    });
    setBuilderOpen(false);
    setEditingView(null);
    applyCustomView(view);
  }

  function closeView(id: string) {
    setTabIds((prev) => {
      const next = prev.filter((x) => x !== id);
      persistTabs(next);
      return next;
    });
    if (currentViewId === id) chooseView("all");
  }

  function deleteCustomView(id: string) {
    setCustomViews((prev) => {
      const next = prev.filter((view) => view.id !== id);
      persistCustomViews(next);
      return next;
    });
    closeView(id);
  }

  function shareView(id: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("view", id);
    navigator.clipboard?.writeText(url.toString()).catch(() => undefined);
    setActionNote("View link copied");
    window.setTimeout(() => setActionNote(""), 1800);
  }

  function runBulkAction(label: string) {
    if (!selectedCount) {
      onSelectAll();
      setActionNote("All visible leads selected");
      return;
    }
    if (["Update field", "Update status"].includes(label)) {
      setBulkEditor("status");
      return;
    }
    if (["Assign to", "Assign owner"].includes(label)) {
      setBulkEditor("owner");
      return;
    }
    if (["Add tags", "Add buyer tag", "Add investor tag", "Remove tags"].includes(label)) {
      setBulkEditor("tag");
      return;
    }
    setActionNote(`${label} queued for ${selectedCount} leads`);
    window.setTimeout(() => setActionNote(""), 2200);
  }

  async function applyBulk(patch: Record<string, any>) {
    setActionNote(`Updating ${selectedCount} leads...`);
    await onBulkUpdate(patch);
    setBulkEditor(null);
    setActionNote("Bulk update done");
    window.setTimeout(() => setActionNote(""), 2200);
  }

  return (
    <>
      <div className="mb-0 flex flex-wrap items-center gap-2 border-b border-[#d9e2ec] bg-white px-0 pb-3 md:px-1">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search leads, phone, email..."
            className="input h-9 rounded border-[#c8d6e3] bg-white pl-9 focus:border-brand-400"
          />
        </div>
        <button className="btn-outline hidden h-9 rounded border-[#c8d6e3] sm:inline-flex"><Download className="h-4 w-4" /> Export</button>
        <button onClick={() => setOpen(true)} className="btn-primary h-9 rounded">
          <Plus className="h-4 w-4" /> New Lead
        </button>
      </div>

      <div className="mb-0 flex items-center gap-0 border-b border-[#d9e2ec] bg-white">
        <div className="flex min-w-0 items-center gap-0 overflow-x-auto">
          {tabIds.map((id) => {
            const custom = customViews.find((v) => v.id === id);
            const view = custom ? { ...getLeadView("all"), id: custom.id, label: custom.label, tone: "bg-purple-50 text-purple-700" } : getLeadView(id);
            const active = currentViewId === view.id || (currentViewId === "all" && view.id === "all");
            return (
              <div
                key={view.id}
                className={cn(
                  "group flex items-center gap-1 border-x border-transparent text-sm font-medium transition whitespace-nowrap",
                  active ? "border-[#d9e2ec] bg-[#eef4f9] text-[#0b4f8a]" : "text-[#29465f] hover:bg-[#f4f7fa] hover:text-[#092f4f]",
                )}
              >
                <button onClick={() => chooseView(view.id)} className="flex h-10 items-center gap-2 pl-3 pr-1">
                  <span>{view.shortLabel ?? view.label}</span>
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[11px]", view.tone)}>{custom?.count ?? viewCounts[view.id] ?? 0}</span>
                </button>
                {custom ? (
                  <ViewTabMenu
                    view={custom}
                    onRename={() => { setEditingView(custom); setBuilderOpen(true); }}
                    onShare={() => shareView(custom.id)}
                    onDelete={() => deleteCustomView(custom.id)}
                    onClose={() => closeView(custom.id)}
                  />
                ) : view.id !== "all" && (
                  <button onClick={() => closeView(view.id)} className="mr-2 grid h-6 w-6 place-items-center rounded text-[#6b8092] opacity-0 hover:bg-white hover:text-red-500 group-hover:opacity-100">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <AddViewMenu present={new Set(tabIds)} onAdd={addView} onCreate={() => { setEditingView(null); setBuilderOpen(true); }} />
      </div>

      {selectedCount > 0 ? (
        <SelectedBulkBar
          selectedCount={selectedCount}
          actionNote={actionNote}
          onAction={runBulkAction}
          onClearSelection={onClearSelection}
        />
      ) : (
        <div className="mb-3 flex items-center justify-between gap-2 overflow-x-auto border-b border-[#d9e2ec] bg-[#eef3f8] px-2 py-2.5 md:mb-0 md:overflow-visible">
          <div className="flex min-w-max items-center gap-2">
            <ViewModeMenu mode={mode} groupBy={groupBy} onModeChange={onModeChange} onGroupByChange={onGroupByChange} />
            <DensityMenu />
            <BulkActionsMenu selectedCount={selectedCount} onSelectAll={onSelectAll} onClearSelection={onClearSelection} onAction={runBulkAction} />
            <FilterPanel sources={sources} projects={projects} owners={owners} updateParams={updateParams} />
          </div>
          <button onClick={onCustomize} className="btn-ghost hidden h-8 rounded text-[#29465f] md:inline-flex"><SlidersHorizontal className="h-4 w-4" /> Customize table</button>
        </div>
      )}

      <LeadForm open={open} onClose={() => setOpen(false)} sources={sources} projects={projects} owners={owners} />
      {builderOpen && (
        <ViewBuilderModal
          initial={editingView}
          currentCount={viewCounts[currentView.id] ?? 0}
          sources={sources}
          projects={projects}
          owners={owners}
          currentParams={params}
          mode={mode}
          groupBy={groupBy}
          onClose={() => { setBuilderOpen(false); setEditingView(null); }}
          onSave={saveCustomView}
        />
      )}
      {bulkEditor && (
        <BulkEditorModal
          type={bulkEditor}
          owners={owners}
          selectedCount={selectedCount}
          onClose={() => setBulkEditor(null)}
          onApply={applyBulk}
        />
      )}
    </>
  );
}

function AddViewMenu({ present, onAdd, onCreate }: { present: Set<string>; onAdd: (id: string) => void; onCreate: () => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const term = q.toLowerCase();
  const options = LEAD_VIEWS.filter((view) => !present.has(view.id) && view.label.toLowerCase().includes(term));

  return (
    <div className="relative shrink-0" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} title="Add lead view" className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-brand-600">
        <Plus className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute left-0 top-9 z-40 w-72 overflow-hidden rounded-lg border border-ink-100 bg-white shadow-pop">
          <div className="border-b border-ink-100 p-3">
            <p className="mb-2 text-sm font-semibold text-ink-800">Add lead view</p>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} className="input h-9 pl-8" placeholder="Search views" autoFocus />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            <button onClick={() => { onCreate(); setOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-brand-700 hover:bg-brand-50">
              <Plus className="h-4 w-4" /> Create custom view
            </button>
            <div className="my-1 border-t border-ink-100" />
            {options.map((view) => (
              <button
                key={view.id}
                onClick={() => { onAdd(view.id); setOpen(false); setQ(""); }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-ink-700 hover:bg-brand-50 hover:text-brand-700"
              >
                <span>{view.label}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px]", view.tone)}>View</span>
              </button>
            ))}
            {!options.length && <p className="px-3 py-3 text-sm text-ink-400">No more matching views</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function ViewTabMenu({ view, onRename, onShare, onDelete, onClose }: {
  view: CustomView;
  onRename: () => void;
  onShare: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="relative mr-1" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn("grid h-7 w-7 place-items-center rounded text-[#496579] hover:bg-white", open && "bg-white")}
        aria-label={`${view.label} view actions`}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute left-0 top-8 z-50 w-36 rounded-sm border border-[#d5dde5] bg-white py-1 text-sm text-[#17324d] shadow-[0_10px_22px_rgba(31,50,70,0.18)]">
          <ViewMenuButton icon={Edit3} label="Rename view" onClick={() => { setOpen(false); onRename(); }} />
          <ViewMenuButton icon={Link2} label="Share view" onClick={() => { setOpen(false); onShare(); }} />
          <ViewMenuButton icon={Trash2} label="Delete view" onClick={() => { setOpen(false); onDelete(); }} />
          <ViewMenuButton icon={X} label="Close view" onClick={() => { setOpen(false); onClose(); }} />
        </div>
      )}
    </div>
  );
}

function ViewMenuButton({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex h-9 w-full items-center gap-2 px-3 text-left hover:bg-[#eef3f8]">
      <Icon className="h-4 w-4 text-[#496579]" />
      <span>{label}</span>
    </button>
  );
}

function ViewBuilderModal({
  initial, currentCount, sources, projects, owners, currentParams, mode, groupBy, onClose, onSave,
}: {
  initial: CustomView | null;
  currentCount: number;
  sources: Option[];
  projects: Option[];
  owners: { id: string; full_name: string }[];
  currentParams: Pick<URLSearchParams, "get">;
  mode: LeadTableMode;
  groupBy: LeadGroupBy;
  onClose: () => void;
  onSave: (view: CustomView) => void;
}) {
  const [label, setLabel] = useState(initial?.label ?? "Untitled view");
  const [draftMode, setDraftMode] = useState<LeadTableMode>(initial?.mode ?? mode);
  const [draftGroupBy, setDraftGroupBy] = useState<LeadGroupBy>(initial?.groupBy ?? groupBy);
  const [density, setDensity] = useState<"compact" | "comfortable">(initial?.density ?? (currentParams.get("density") === "compact" ? "compact" : "comfortable"));
  const [filters, setFilters] = useState<ViewFilters>(initial?.filters ?? {
    status: currentParams.get("status") ?? "",
    priority: currentParams.get("priority") ?? "",
    source: currentParams.get("source") ?? "",
    project: currentParams.get("project") ?? "",
    owner: currentParams.get("owner") ?? "",
  });

  function updateFilter(key: keyof ViewFilters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function save() {
    const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) as ViewFilters;
    onSave({
      id: initial?.id ?? `custom-${Date.now()}`,
      label: label.trim() || "Untitled view",
      filters: cleanFilters,
      mode: draftMode,
      groupBy: draftGroupBy,
      density,
      count: initial ? initial.count : currentCount,
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-900/30 p-4">
      <div className="flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-sm border border-[#cdd8e2] bg-white shadow-[0_20px_48px_rgba(20,37,54,0.24)]">
        <div className="flex items-center justify-between border-b border-[#d9e2ec] px-5 py-4">
          <div>
            <p className="text-base font-semibold text-[#17324d]">{initial ? "Rename view" : "Create view"}</p>
            <p className="text-xs text-[#6f8293]">Build a Freshsales-style saved view for the lead table.</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded text-[#496579] hover:bg-[#eef3f8]"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid flex-1 gap-5 overflow-y-auto p-5 md:grid-cols-[1fr_260px]">
          <div className="space-y-4">
            <label className="block">
              <span className="label">View name</span>
              <input value={label} onChange={(e) => setLabel(e.target.value)} className="input h-9 rounded-sm" autoFocus />
            </label>

            <div className="rounded-sm border border-[#d9e2ec]">
              <div className="border-b border-[#d9e2ec] bg-[#f8fafc] px-3 py-2 text-sm font-semibold text-[#17324d]">Filter records</div>
              <div className="grid gap-3 p-3 sm:grid-cols-2">
                <SelectField label="Lifecycle stage" value={filters.status ?? ""} onChange={(value) => updateFilter("status", value)}>
                  <option value="">Any status</option>
                  {LEAD_STATUS_ORDER.map((s) => <option key={s} value={s}>{LEAD_STATUS[s].label}</option>)}
                </SelectField>
                <SelectField label="Customer fit" value={filters.priority ?? ""} onChange={(value) => updateFilter("priority", value)}>
                  <option value="">Any priority</option>
                  <option value="hot">Hot</option>
                  <option value="warm">Warm</option>
                  <option value="cold">Cold</option>
                </SelectField>
                <SelectField label="Source" value={filters.source ?? ""} onChange={(value) => updateFilter("source", value)}>
                  <option value="">Any source</option>
                  {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </SelectField>
                <SelectField label="Project" value={filters.project ?? ""} onChange={(value) => updateFilter("project", value)}>
                  <option value="">Any project</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </SelectField>
                <SelectField label="Sales owner" value={filters.owner ?? ""} onChange={(value) => updateFilter("owner", value)}>
                  <option value="">Any owner</option>
                  {owners.map((o) => <option key={o.id} value={o.id}>{o.full_name}</option>)}
                </SelectField>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-sm border border-[#d9e2ec] p-3">
              <p className="mb-2 text-sm font-semibold text-[#17324d]">Show as</p>
              <div className="grid grid-cols-2 gap-2">
                <BuilderChoice label="Table" selected={draftMode === "table"} onClick={() => setDraftMode("table")} />
                <BuilderChoice label="Status" selected={draftMode === "status"} onClick={() => setDraftMode("status")} />
              </div>
              <div className="mt-3">
                <SelectField label="Group by" value={draftGroupBy} onChange={(value) => { setDraftGroupBy(value as LeadGroupBy); setDraftMode("group"); }}>
                  {(["status", "priority", "owner", "source", "project"] as LeadGroupBy[]).map((item) => (
                    <option key={item} value={item}>{item.replace("_", " ")}</option>
                  ))}
                </SelectField>
              </div>
            </div>

            <div className="rounded-sm border border-[#d9e2ec] p-3">
              <p className="mb-2 text-sm font-semibold text-[#17324d]">Row density</p>
              <div className="grid grid-cols-2 gap-2">
                <BuilderChoice label="Compact" selected={density === "compact"} onClick={() => setDensity("compact")} />
                <BuilderChoice label="Comfort" selected={density === "comfortable"} onClick={() => setDensity("comfortable")} />
              </div>
            </div>

            <div className="rounded-sm bg-[#eef4f9] p-3 text-sm text-[#29465f]">
              This view will appear as a tab card with its own saved filters and table layout.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#d9e2ec] px-5 py-4">
          <button
            onClick={() => {
              setFilters({});
              setDraftMode("table");
              setDraftGroupBy("status");
              setDensity("comfortable");
            }}
            className="btn-outline h-9 rounded-sm"
          >
            Reset
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-outline h-9 rounded-sm">Cancel</button>
            <button onClick={save} className="btn-primary h-9 rounded-sm">Save view</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BuilderChoice({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn("h-9 rounded-sm border px-3 text-sm font-medium", selected ? "border-[#1f63d6] bg-[#eef4ff] text-[#1f63d6]" : "border-[#d9e2ec] bg-white text-[#29465f] hover:bg-[#f8fafc]")}
    >
      {label}
    </button>
  );
}

function ViewModeMenu({
  mode, groupBy, onModeChange, onGroupByChange,
}: {
  mode: LeadTableMode;
  groupBy: LeadGroupBy;
  onModeChange: (mode: LeadTableMode) => void;
  onGroupByChange: (groupBy: LeadGroupBy) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="btn-outline h-8">
        <Table2 className="h-4 w-4" /> {mode === "table" ? "Table" : mode === "status" ? "Status" : `Group: ${groupBy}`} <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-9 z-30 w-56 rounded-lg border border-ink-100 bg-white py-1 shadow-pop">
          <MenuItem icon={Table2} label="Table" selected={mode === "table"} onClick={() => { onModeChange("table"); setOpen(false); }} />
          <MenuItem icon={ListFilter} label="Status" selected={mode === "status"} onClick={() => { onModeChange("status"); setOpen(false); }} />
          <div className="border-t border-ink-100 py-1">
            <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Group by</p>
            {(["status", "priority", "owner", "source", "project"] as LeadGroupBy[]).map((item) => (
              <MenuItem
                key={item}
                icon={Grid3X3}
                label={item.replace("_", " ")}
                selected={mode === "group" && groupBy === item}
                onClick={() => { onGroupByChange(item); onModeChange("group"); setOpen(false); }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SelectedBulkBar({ selectedCount, actionNote, onAction, onClearSelection }: {
  selectedCount: number;
  actionNote: string;
  onAction: (label: string) => void;
  onClearSelection: () => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 bg-ink-50/80 py-3">
      <button onClick={() => onAction("Update field")} className="btn-outline h-9">Update field</button>
      <button onClick={() => onAction("Bulk email")} className="btn-outline h-9">Bulk email</button>
      <SplitBulkButton label="Add tags" options={["Add buyer tag", "Add investor tag", "Remove tags"]} onAction={onAction} />
      <SplitBulkButton label="Add to sequence" options={["Add to sequence", "Remove from sequence"]} onAction={onAction} />
      <button onClick={() => onAction("Assign to")} className="btn-outline h-9">Assign to</button>
      <button onClick={() => onAction("Add task")} className="btn-outline h-9">Add task</button>
      <button onClick={() => onAction("Add to power dialer list")} className="btn-outline h-9">Add to power dialer list</button>
      <button onClick={() => onAction("Merge")} className="btn-outline h-9">Merge</button>
      <button onClick={() => onAction("Bulk SMS")} className="btn-outline h-9">Bulk SMS</button>
      <button onClick={() => onAction("Delete")} className="btn-outline h-9">Delete</button>
      <button onClick={onClearSelection} className="btn-ghost h-9 text-ink-600"><X className="h-4 w-4" /> Cancel bulk selection</button>
      <span className="ml-auto rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
        {actionNote || `${selectedCount} leads selected`}
      </span>
    </div>
  );
}

function SplitBulkButton({ label, options, onAction }: { label: string; options: string[]; onAction: (label: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-flex">
      <button onClick={() => onAction(label)} className="btn-outline h-9 rounded-r-none">{label}</button>
      <button onClick={() => setOpen((v) => !v)} className="btn-outline h-9 rounded-l-none border-l-0 px-2"><ChevronDown className="h-4 w-4" /></button>
      {open && (
        <div className="absolute right-0 top-10 z-40 w-48 rounded-lg border border-ink-100 bg-white py-1 shadow-pop">
          {options.map((option) => (
            <button key={option} onClick={() => { onAction(option); setOpen(false); }} className="w-full px-3 py-2 text-left text-sm text-ink-700 hover:bg-brand-50">
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BulkActionsMenu({ selectedCount, onSelectAll, onClearSelection, onAction }: {
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onAction: (label: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="btn-ghost h-8 text-ink-600">
        <Layers3 className="h-4 w-4" /> Bulk actions
        {selectedCount > 0 && <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[11px] text-brand-700">{selectedCount}</span>}
      </button>
      {open && (
        <div className="absolute left-0 top-9 z-30 w-56 rounded-lg border border-ink-100 bg-white py-1 shadow-pop">
          <button onClick={() => { onSelectAll(); setOpen(false); }} className="w-full px-3 py-2 text-left text-sm text-ink-700 hover:bg-brand-50">Select all visible</button>
          <button onClick={() => { onAction("Assign owner"); setOpen(false); }} disabled={!selectedCount} className="w-full px-3 py-2 text-left text-sm text-ink-700 hover:bg-brand-50 disabled:opacity-40">Assign owner</button>
          <button onClick={() => { onAction("Update status"); setOpen(false); }} disabled={!selectedCount} className="w-full px-3 py-2 text-left text-sm text-ink-700 hover:bg-brand-50 disabled:opacity-40">Update status</button>
          <button onClick={() => { onClearSelection(); setOpen(false); }} disabled={!selectedCount} className="w-full px-3 py-2 text-left text-sm text-ink-700 hover:bg-brand-50 disabled:opacity-40">Clear selection</button>
        </div>
      )}
    </div>
  );
}

function DensityMenu() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const density = params.get("density") ?? "comfortable";

  function setDensity(next: string) {
    const sp = new URLSearchParams(params.toString());
    sp.set("density", next);
    router.replace(`${pathname}?${sp.toString()}`);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="btn-ghost h-8 text-ink-600">
        <ListFilter className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute left-0 top-9 z-30 w-40 rounded-lg border border-ink-100 bg-white py-1 shadow-pop">
          {["compact", "comfortable"].map((item) => (
            <button key={item} onClick={() => setDensity(item)} className={cn("flex w-full items-center justify-between px-3 py-2 text-sm capitalize hover:bg-brand-50", density === item ? "text-brand-700" : "text-ink-700")}>
              {item}
              {density === item && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPanel({
  sources, projects, owners, updateParams,
}: {
  sources: Option[];
  projects: Option[];
  owners: { id: string; full_name: string }[];
  updateParams: (patch: Record<string, string | null>) => void;
}) {
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    status: params.get("status") ?? "",
    priority: params.get("priority") ?? "",
    source: params.get("source") ?? "",
    project: params.get("project") ?? "",
    owner: params.get("owner") ?? "",
  });

  return (
    <>
      <button onClick={() => setOpen(true)} className={cn("btn-ghost h-8 text-ink-600", open && "bg-ink-200")}>
        <Filter className="h-4 w-4" /> Filter by
      </button>
      {open && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-ink-100 bg-white shadow-pop">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <p className="font-semibold text-ink-900">Filter leads</p>
            <button onClick={() => setOpen(false)} className="btn-ghost h-8 w-8 p-0"><X className="h-4 w-4" /></button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <SelectField label="Lifecycle stage" value={draft.status} onChange={(status) => setDraft((d) => ({ ...d, status }))}>
              <option value="">Any status</option>
              {LEAD_STATUS_ORDER.map((s) => <option key={s} value={s}>{LEAD_STATUS[s].label}</option>)}
            </SelectField>
            <SelectField label="Customer fit" value={draft.priority} onChange={(priority) => setDraft((d) => ({ ...d, priority }))}>
              <option value="">Any priority</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
            </SelectField>
            <SelectField label="Source" value={draft.source} onChange={(source) => setDraft((d) => ({ ...d, source }))}>
              <option value="">Any source</option>
              {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </SelectField>
            <SelectField label="Project" value={draft.project} onChange={(project) => setDraft((d) => ({ ...d, project }))}>
              <option value="">Any project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </SelectField>
            <SelectField label="Sales owner" value={draft.owner} onChange={(owner) => setDraft((d) => ({ ...d, owner }))}>
              <option value="">Any owner</option>
              {owners.map((o) => <option key={o.id} value={o.id}>{o.full_name}</option>)}
            </SelectField>
          </div>
          <div className="flex items-center justify-between border-t border-ink-100 p-4">
            <button
              onClick={() => {
                setDraft({ status: "", priority: "", source: "", project: "", owner: "" });
                updateParams({ status: null, priority: null, source: null, project: null, owner: null });
              }}
              className="btn-outline h-9"
            >
              Clear
            </button>
            <button
              onClick={() => {
                updateParams({
                  status: draft.status || null,
                  priority: draft.priority || null,
                  source: draft.source || null,
                  project: draft.project || null,
                  owner: draft.owner || null,
                });
                setOpen(false);
              }}
              className="btn-primary h-9"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input h-9">
        {children}
      </select>
    </label>
  );
}

function BulkEditorModal({
  type, owners, selectedCount, onClose, onApply,
}: {
  type: "status" | "owner" | "tag";
  owners: { id: string; full_name: string }[];
  selectedCount: number;
  onClose: () => void;
  onApply: (patch: Record<string, any>) => Promise<void>;
}) {
  const [value, setValue] = useState(type === "status" ? "contacted" : "");
  const [saving, setSaving] = useState(false);
  const title = type === "status" ? "Update field" : type === "owner" ? "Assign to" : "Add tags";

  async function submit() {
    if (!value.trim()) return;
    setSaving(true);
    if (type === "status") await onApply({ status: value });
    if (type === "owner") await onApply({ owner_id: value });
    if (type === "tag") await onApply({ tags: [value.trim()] });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-900/30 p-4">
      <div className="w-full max-w-sm rounded-lg border border-ink-100 bg-white shadow-pop">
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
          <div>
            <p className="font-semibold text-ink-900">{title}</p>
            <p className="text-xs text-ink-400">{selectedCount} leads selected</p>
          </div>
          <button onClick={onClose} className="btn-ghost h-8 w-8 p-0"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4">
          {type === "status" && (
            <SelectField label="Lifecycle stage" value={value} onChange={setValue}>
              {LEAD_STATUS_ORDER.map((s) => <option key={s} value={s}>{LEAD_STATUS[s].label}</option>)}
            </SelectField>
          )}
          {type === "owner" && (
            <SelectField label="Sales owner" value={value} onChange={setValue}>
              <option value="">Select owner</option>
              {owners.map((o) => <option key={o.id} value={o.id}>{o.full_name}</option>)}
            </SelectField>
          )}
          {type === "tag" && (
            <label className="block">
              <span className="label">Tag name</span>
              <input value={value} onChange={(e) => setValue(e.target.value)} className="input h-9" placeholder="e.g. Site visit" autoFocus />
            </label>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-ink-100 p-4">
          <button onClick={onClose} className="btn-outline h-9">Cancel</button>
          <button onClick={submit} disabled={saving || !value.trim()} className="btn-primary h-9">{saving ? "Applying..." : "Apply"}</button>
        </div>
      </div>
    </div>
  );
}

function MenuItem({ icon: Icon, label, selected, onClick }: { icon: any; label: string; selected?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex w-full items-center justify-between gap-2 px-3 py-2 text-sm capitalize hover:bg-brand-50", selected ? "text-brand-700" : "text-ink-700")}>
      <span className="flex items-center gap-2"><Icon className="h-4 w-4" /> {label}</span>
      {selected && <Check className="h-4 w-4" />}
    </button>
  );
}
