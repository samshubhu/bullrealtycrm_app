"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Building2, CalendarPlus, CheckSquare, ClipboardList, Copy, Edit3, ExternalLink, FileText,
  GripVertical, Mail, MessageSquare, MoreVertical, Phone, Plus, Search, Trash2, UserX, X,
} from "lucide-react";
import { Card, EmptyState } from "@/components/ui";
import { StatusBadge, PriorityBadge } from "@/components/ui/badges";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency, cn } from "@/lib/utils";
import { LeadsToolbar } from "./leads-toolbar";
import { Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { LEAD_PIPELINE_STATUS, LEAD_PIPELINE_STATUS_ORDER, LEAD_STATUS, LEAD_STATUS_ORDER } from "@/lib/constants";

interface LeadFormOption { id: string; name: string }

export type LeadTableMode = "table" | "status" | "group";
export type LeadGroupBy = "status" | "priority" | "owner" | "source" | "project";

interface LeadsListShellProps {
  leads: any[];
  sources: LeadFormOption[];
  projects: LeadFormOption[];
  owners: { id: string; full_name: string }[];
  openNew?: boolean;
  viewCounts: Record<string, number>;
  density: "compact" | "comfortable";
}

const COLUMNS = [
  { key: "leadId", label: "Lead ID", defaultWidth: 150 },
  { key: "name", label: "Name", defaultWidth: 260 },
  { key: "mobile", label: "Mobile number", defaultWidth: 160 },
  { key: "email", label: "Email ID", defaultWidth: 220 },
  { key: "country", label: "Country", defaultWidth: 130 },
  { key: "status", label: "Lead status", defaultWidth: 160 },
  { key: "source", label: "Lead source", defaultWidth: 160 },
  { key: "pipelineStatus", label: "Pipeline status", defaultWidth: 170 },
  { key: "owner", label: "Lead owner", defaultWidth: 170 },
  { key: "manager", label: "Supporting manager", defaultWidth: 190 },
  { key: "siteVisitDone", label: "Site visit done", defaultWidth: 150 },
  { key: "siteVisitPending", label: "Site visit pending", defaultWidth: 170 },
  { key: "obmDone", label: "OBM done", defaultWidth: 130 },
  { key: "obmPending", label: "OBM pending", defaultWidth: 150 },
  { key: "lastActivityType", label: "Last activity type", defaultWidth: 170 },
  { key: "lastActivityAt", label: "Last activity date & time", defaultWidth: 210 },
  { key: "assignedAt", label: "Lead assigned date & time", defaultWidth: 220 },
  { key: "assignedBy", label: "Lead assigned by", defaultWidth: 170 },
  { key: "createdAt", label: "Lead created date & time", defaultWidth: 220 },
  { key: "priority", label: "Priority", defaultWidth: 130 },
  { key: "project", label: "Project", defaultWidth: 220 },
  { key: "budget", label: "Budget", defaultWidth: 140 },
  { key: "score", label: "Score", defaultWidth: 120 },
] as const;

type ColumnKey = typeof COLUMNS[number]["key"];
type LeadSort = { key: ColumnKey; dir: "asc" | "desc" };
const GRID_BORDER = "border-r border-b border-[#d9e2ec]";
const HEAD_CELL = `${GRID_BORDER} bg-[#f8fafc] px-3 py-0`;
const BODY_CELL = `${GRID_BORDER} px-4 py-2`;
const DEFAULT_COLUMN_ORDER = COLUMNS.map((c) => c.key);
const COLUMN_MAP = Object.fromEntries(COLUMNS.map((c) => [c.key, c])) as Record<ColumnKey, typeof COLUMNS[number]>;
const COLUMN_KEYS = new Set<ColumnKey>(DEFAULT_COLUMN_ORDER);

export function LeadsListShell(props: LeadsListShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const initialSort = parseSort(params);
  const [rows, setRows] = useState(props.leads);
  const [mode, setMode] = useState<LeadTableMode>("table");
  const [groupBy, setGroupBy] = useState<LeadGroupBy>("status");
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [columnOrder, setColumnOrder] = useState<ColumnKey[]>(DEFAULT_COLUMN_ORDER);
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(
    () => Object.fromEntries(COLUMNS.map((c) => [c.key, true])) as Record<ColumnKey, boolean>,
  );
  const [widths, setWidths] = useState<Record<ColumnKey, number>>(
    () => Object.fromEntries(COLUMNS.map((c) => [c.key, c.defaultWidth])) as Record<ColumnKey, number>,
  );
  const [rowHeight, setRowHeight] = useState(props.density === "compact" ? 42 : 54);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [sort, setSort] = useState<LeadSort | null>(initialSort);

  const selectedCount = selected.size;
  useEffect(() => { setRows(props.leads); setPage(1); }, [props.leads]);
  useEffect(() => setPage(1), [perPage, sort]);
  useEffect(() => setSort(parseSort(params)), [params]);

  const sortedRows = useMemo(() => sortLeads(rows, sort), [rows, sort]);
  const total = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const pagedRows = useMemo(() => sortedRows.slice((safePage - 1) * perPage, safePage * perPage), [sortedRows, safePage, perPage]);
  const visibleIds = pagedRows.map((lead) => lead.id);

  const orderedColumns = columnOrder.map((key) => COLUMN_MAP[key]).filter((column) => visibleColumns[column.key]);
  const hiddenColumns = COLUMNS.filter((c) => !visibleColumns[c.key]);
  function addColumn(key: ColumnKey, anchor: ColumnKey, side: "left" | "right") {
    setVisibleColumns((p) => ({ ...p, [key]: true }));
    setColumnOrder((prev) => {
      const next = prev.filter((item) => item !== key);
      const anchorIndex = next.indexOf(anchor);
      if (anchorIndex === -1) return [...next, key];
      next.splice(side === "left" ? anchorIndex : anchorIndex + 1, 0, key);
      return next;
    });
  }
  function collapseColumn(key: ColumnKey) { setWidths((p) => ({ ...p, [key]: 60 })); }
  function removeColumn(key: ColumnKey) {
    setVisibleColumns((p) => ({ ...p, [key]: false }));
    if (sort?.key === key) updateSort(null);
  }

  function updateSort(next: LeadSort | null) {
    setSort(next);
    const sp = new URLSearchParams(params.toString());
    if (next) {
      sp.set("sort", next.key);
      sp.set("sort_dir", next.dir);
    } else {
      sp.delete("sort");
      sp.delete("sort_dir");
    }
    const query = sp.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  async function updateLead(id: string, patch: Record<string, any>) {
    setRows((prev) => prev.map((lead) => lead.id === id ? { ...lead, ...patch } : lead));
    const res = await fetch(`/api/leads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error("Lead update failed");
    router.refresh();
  }

  async function bulkUpdate(patch: Record<string, any>) {
    const ids = [...selected];
    if (!ids.length) return;
    await Promise.all(ids.map((id) => updateLead(id, patch)));
    setSelected(new Set());
  }

  function toggleLead(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelected(new Set(visibleIds));
  }

  return (
    <>
      <LeadsToolbar
        sources={props.sources}
        projects={props.projects}
        owners={props.owners}
        openNew={props.openNew}
        viewCounts={props.viewCounts}
        mode={mode}
        groupBy={groupBy}
        selectedCount={selectedCount}
        onModeChange={setMode}
        onGroupByChange={setGroupBy}
        onCustomize={() => setCustomizeOpen(true)}
        onSelectAll={selectAllVisible}
        onClearSelection={() => setSelected(new Set())}
        onBulkUpdate={bulkUpdate}
      />

      <MobileLeadCards leads={pagedRows} total={total} />

      <div className="hidden md:block">
        <LeadTable
          leads={pagedRows}
          owners={props.owners}
          projects={props.projects}
          mode={mode}
          groupBy={groupBy}
          selected={selected}
          columns={orderedColumns}
          visibleColumns={visibleColumns}
          widths={widths}
          rowHeight={rowHeight}
          onToggleLead={toggleLead}
          onToggleAll={() => visibleIds.every((id) => selected.has(id)) ? setSelected(new Set()) : selectAllVisible()}
          onWidthChange={(key, width) => setWidths((prev) => ({ ...prev, [key]: width }))}
          onRowHeightChange={setRowHeight}
          onUpdateLead={updateLead}
          page={safePage}
          perPage={perPage}
          total={total}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          sort={sort}
          onSort={updateSort}
          hiddenColumns={hiddenColumns}
          onAddColumn={addColumn}
          onCollapseColumn={collapseColumn}
          onRemoveColumn={removeColumn}
          onEditAllColumns={() => setCustomizeOpen(true)}
        />
      </div>

      {customizeOpen && (
        <CustomizeDrawer
          visibleColumns={visibleColumns}
          onChange={setVisibleColumns}
          onReset={() => {
            setVisibleColumns(Object.fromEntries(COLUMNS.map((c) => [c.key, true])) as Record<ColumnKey, boolean>);
            setColumnOrder(DEFAULT_COLUMN_ORDER);
            setWidths(Object.fromEntries(COLUMNS.map((c) => [c.key, c.defaultWidth])) as Record<ColumnKey, number>);
            setRowHeight(props.density === "compact" ? 42 : 54);
          }}
          onClose={() => setCustomizeOpen(false)}
        />
      )}
    </>
  );
}

function MobileLeadCards({ leads, total }: { leads: any[]; total: number }) {
  if (!leads.length) {
    return (
      <Card className="overflow-hidden rounded-2xl border-[#d9e2ec] shadow-none md:hidden">
        <EmptyState icon={Users} title="No leads found" description="Try adjusting filters or create a new lead." />
      </Card>
    );
  }

  return (
    <div className="space-y-3 md:hidden">
      <p className="px-1 text-xs font-medium text-ink-400">{total} leads</p>
      {leads.map((lead) => (
        <Link key={lead.id} href={`/leads/${lead.id}`} className="block rounded-2xl border border-ink-100 bg-white p-4 shadow-card active:scale-[0.99]">
          <div className="flex items-start gap-3">
            <Avatar name={lead.full_name} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink-900">{lead.full_name}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-400">{lead.city ?? lead.project?.name ?? "Lead"}</p>
                </div>
                <ScoreCell score={lead.score ?? 0} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={lead.status} />
                <PriorityBadge priority={lead.priority} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-ink-50 px-3 py-2">
                  <p className="text-ink-400">Budget</p>
                  <p className="mt-0.5 font-semibold text-ink-800">{formatCurrency(lead.budget)}</p>
                </div>
                <div className="rounded-xl bg-ink-50 px-3 py-2">
                  <p className="text-ink-400">Owner</p>
                  <p className="mt-0.5 truncate font-semibold text-ink-800">{lead.owner?.full_name ?? "Unassigned"}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-ink-400">
                <span className="truncate">{lead.phone ?? lead.email ?? "No contact"}</span>
                <span>{lead.last_activity_at ? formatDistanceToNow(new Date(lead.last_activity_at), { addSuffix: true }) : ""}</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function LeadTable({
  leads, owners, projects, mode, groupBy, selected, visibleColumns, widths, rowHeight,
  columns,
  onToggleLead, onToggleAll, onWidthChange, onRowHeightChange, onUpdateLead,
  page, perPage, total, onPageChange, onPerPageChange,
  sort, onSort, hiddenColumns, onAddColumn, onCollapseColumn, onRemoveColumn, onEditAllColumns,
}: {
  leads: any[];
  owners: { id: string; full_name: string }[];
  projects: LeadFormOption[];
  mode: LeadTableMode;
  groupBy: LeadGroupBy;
  selected: Set<string>;
  columns: typeof COLUMNS[number][];
  visibleColumns: Record<ColumnKey, boolean>;
  widths: Record<ColumnKey, number>;
  rowHeight: number;
  onToggleLead: (id: string) => void;
  onToggleAll: () => void;
  onWidthChange: (key: ColumnKey, width: number) => void;
  onRowHeightChange: (height: number) => void;
  onUpdateLead: (id: string, patch: Record<string, any>) => Promise<void>;
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  sort: LeadSort | null;
  onSort: (sort: LeadSort | null) => void;
  hiddenColumns: { key: ColumnKey; label: string }[];
  onAddColumn: (key: ColumnKey, anchor: ColumnKey, side: "left" | "right") => void;
  onCollapseColumn: (key: ColumnKey) => void;
  onRemoveColumn: (key: ColumnKey) => void;
  onEditAllColumns: () => void;
}) {
  const activeGroup = mode === "table" ? null : mode === "status" ? "status" : groupBy;
  const groups = useMemo(() => groupLeads(leads, activeGroup), [leads, activeGroup]);

  if (!leads.length) {
    return (
      <Card className="overflow-hidden rounded-lg border-[#d9e2ec] shadow-none">
        <EmptyState icon={Users} title="No leads found" description="Try adjusting filters or create a new lead." />
      </Card>
    );
  }

  return (
    <div className="min-h-[520px] overflow-hidden rounded-lg border border-[#d9e2ec] bg-white shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse bg-white text-sm">
          <thead>
            <tr className="bg-[#f8fafc] text-left text-xs font-semibold text-[#29465f]">
              <th className={`w-10 ${GRID_BORDER} bg-[#f8fafc] px-3 py-3`}>
                <button onClick={onToggleAll}><CheckSquare className="h-4 w-4 text-ink-300" /></button>
              </th>
              {columns.map((column) => (
                <ResizableHead
                  key={column.key}
                  column={column}
                  width={widths[column.key]}
                  onWidthChange={onWidthChange}
                  sort={sort}
                  onSort={onSort}
                  hiddenColumns={hiddenColumns}
                  onAddColumn={onAddColumn}
                  onCollapseColumn={onCollapseColumn}
                  onRemoveColumn={onRemoveColumn}
                  onEditAllColumns={onEditAllColumns}
                />
              ))}
              <th className={`w-12 ${GRID_BORDER} bg-[#f8fafc] px-3 py-3`}><Plus className="h-4 w-4 text-ink-400" /></th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <RowGroup
                key={group.key}
                group={group}
                showHeader={!!activeGroup}
                selected={selected}
                visibleColumns={visibleColumns}
                rowHeight={rowHeight}
                owners={owners}
                projects={projects}
                onToggleLead={onToggleLead}
                onRowHeightChange={onRowHeightChange}
                onUpdateLead={onUpdateLead}
              />
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} perPage={perPage} total={total} onPageChange={onPageChange} onPerPageChange={onPerPageChange} />
    </div>
  );
}

function Pagination({ page, perPage, total, onPageChange, onPerPageChange }: {
  page: number; perPage: number; total: number;
  onPageChange: (page: number) => void; onPerPageChange: (perPage: number) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  // Compact page-number window (e.g. 1 … 4 5 6 … 12)
  const pages: (number | "…")[] = [];
  const push = (n: number | "…") => pages.push(n);
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) push(i);
  } else {
    push(1);
    if (page > 3) push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) push(i);
    if (page < totalPages - 2) push("…");
    push(totalPages);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#d9e2ec] bg-white px-4 py-2.5 text-xs text-[#5f7285]">
      <span>Showing <span className="font-medium text-ink-700">{start}-{end}</span> of <span className="font-medium text-ink-700">{total}</span></span>

      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}
          className="grid h-7 w-7 place-items-center rounded-md border border-[#d9e2ec] text-ink-500 hover:bg-ink-50 disabled:opacity-40 disabled:hover:bg-transparent">
          <ChevronLeftIcon />
        </button>
        {pages.map((p, i) => p === "…" ? (
          <span key={`e${i}`} className="px-1.5 text-ink-400">…</span>
        ) : (
          <button key={p} onClick={() => onPageChange(p)}
            className={cn("grid h-7 min-w-7 place-items-center rounded-md border px-1.5 text-xs font-medium", p === page ? "border-brand-600 bg-brand-600 text-white" : "border-[#d9e2ec] text-ink-600 hover:bg-ink-50")}>
            {p}
          </button>
        ))}
        <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
          className="grid h-7 w-7 place-items-center rounded-md border border-[#d9e2ec] text-ink-500 hover:bg-ink-50 disabled:opacity-40 disabled:hover:bg-transparent">
          <ChevronRightIcon />
        </button>
      </div>

      <div className="relative">
        <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-1 rounded-md px-2 py-1 font-medium text-brand-700 hover:bg-brand-50">
          Showing {perPage} per page
          <ChevronUpIcon className={cn("h-3.5 w-3.5 transition", menuOpen && "rotate-180")} />
        </button>
        {menuOpen && (
          <div className="absolute bottom-9 right-0 z-40 w-44 overflow-hidden rounded-lg border border-ink-100 bg-white py-1 shadow-pop">
            {[10, 25, 50, 100].map((n) => (
              <button key={n} onClick={() => { onPerPageChange(n); setMenuOpen(false); }}
                className={cn("block w-full px-3 py-2 text-left text-sm hover:bg-brand-50", n === perPage ? "font-medium text-brand-700" : "text-ink-700")}>
                Show {n} per page
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChevronLeftIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>; }
function ChevronRightIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>; }
function ChevronUpIcon({ className }: { className?: string }) { return <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6" /></svg>; }

function ResizableHead({ column, width, onWidthChange, sort, onSort, hiddenColumns, onAddColumn, onCollapseColumn, onRemoveColumn, onEditAllColumns }: {
  column: typeof COLUMNS[number];
  width: number;
  onWidthChange: (key: ColumnKey, width: number) => void;
  sort: LeadSort | null;
  onSort: (sort: LeadSort | null) => void;
  hiddenColumns: { key: ColumnKey; label: string }[];
  onAddColumn: (key: ColumnKey, anchor: ColumnKey, side: "left" | "right") => void;
  onCollapseColumn: (key: ColumnKey) => void;
  onRemoveColumn: (key: ColumnKey) => void;
  onEditAllColumns: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const active = sort?.key === column.key ? sort.dir : null;

  function onPointerDown(e: React.PointerEvent<HTMLSpanElement>) {
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = width;
    const move = (event: PointerEvent) => onWidthChange(column.key, Math.max(60, startWidth + event.clientX - startX));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <th className={`relative h-10 ${HEAD_CELL}`} style={{ width }}>
      <button onClick={() => onSort(active === "asc" ? { key: column.key, dir: "desc" } : { key: column.key, dir: "asc" })}
        className="flex h-full w-full min-w-0 items-center gap-1.5 pr-6 text-left">
        <span className="truncate">{column.label}</span>
        {active === "asc" && <SortArrow dir="asc" />}
        {active === "desc" && <SortArrow dir="desc" />}
      </button>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className={cn(
          "absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-[#36546c] hover:bg-[#e9eef3]",
          menuOpen && "bg-[#e9eef3]",
        )}
        aria-label={`${column.label} column menu`}
      >
        <CaretDown />
      </button>
      {menuOpen && (
        <HeaderMenu
          column={column}
          active={active}
          hiddenColumns={hiddenColumns}
          onSort={(dir) => { onSort({ key: column.key, dir }); setMenuOpen(false); }}
          onAddColumn={(key, side) => { onAddColumn(key, column.key, side); setMenuOpen(false); }}
          onCollapse={() => { onCollapseColumn(column.key); setMenuOpen(false); }}
          onRemove={() => { onRemoveColumn(column.key); setMenuOpen(false); }}
          onEditAll={() => { onEditAllColumns(); setMenuOpen(false); }}
          onClose={() => setMenuOpen(false)}
        />
      )}
      <span onPointerDown={onPointerDown} className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-brand-300" />
    </th>
  );
}

function HeaderMenu({ column, active, hiddenColumns, onSort, onAddColumn, onCollapse, onRemove, onEditAll, onClose }: {
  column: typeof COLUMNS[number];
  active: "asc" | "desc" | null;
  hiddenColumns: { key: ColumnKey; label: string }[];
  onSort: (dir: "asc" | "desc") => void;
  onAddColumn: (key: ColumnKey, side: "left" | "right") => void;
  onCollapse: () => void;
  onRemove: () => void;
  onEditAll: () => void;
  onClose: () => void;
}) {
  const [picker, setPicker] = useState<null | "right" | "left">(null);
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute left-0 top-10 z-40 w-[236px] rounded-sm border border-[#d5dde5] bg-white py-1 text-[14px] font-normal text-[#17324d] shadow-[0_10px_22px_rgba(31,50,70,0.18)]">
        <MenuItem icon={<ArrowIcon up />} label="Sort ascending A → Z" active={active === "asc"} onClick={() => onSort("asc")} />
        <MenuItem icon={<ArrowIcon />} label="Sort descending Z → A" active={active === "desc"} onClick={() => onSort("desc")} />
        <Divider />
        <SubMenuItem label="Add column to the right" side="right" open={picker === "right"} onToggle={() => setPicker(picker === "right" ? null : "right")} hiddenColumns={hiddenColumns} onPick={onAddColumn} />
        <SubMenuItem label="Add column to the left" side="left" open={picker === "left"} onToggle={() => setPicker(picker === "left" ? null : "left")} hiddenColumns={hiddenColumns} onPick={onAddColumn} />
        <MenuItem icon={<CollapseIcon />} label="Collapse column" onClick={onCollapse} />
        {column.key !== "name" && <MenuItem icon={<RemoveIcon />} label="Remove column" onClick={onRemove} />}
        <Divider />
        <MenuItem icon={<GridIcon />} label="Edit all columns" onClick={onEditAll} />
        <MenuItem icon={<FilterIcon />} label="Add as filter" onClick={onClose} />
      </div>
    </>
  );
}

function MenuItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex h-9 w-full items-center gap-2.5 px-3 text-left hover:bg-[#eef3f8]", active ? "font-medium text-[#0b63ce]" : "text-[#17324d]")}>
      <span className={cn("grid h-4 w-4 place-items-center", active ? "text-[#0b63ce]" : "text-[#6d8294]")}>{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function SubMenuItem({ label, side, open, onToggle, hiddenColumns, onPick }: {
  label: string; side: "left" | "right"; open: boolean; onToggle: () => void;
  hiddenColumns: { key: ColumnKey; label: string }[]; onPick: (key: ColumnKey, side: "left" | "right") => void;
}) {
  const [q, setQ] = useState("");
  const term = q.toLowerCase();
  const basicFields = COLUMNS.filter((c) => ["name", "mobile", "email", "status", "owner"].includes(c.key) && c.label.toLowerCase().includes(term));
  const filtered = hiddenColumns.filter((c) => c.label.toLowerCase().includes(term));
  return (
    <div className="relative">
      <button onClick={onToggle} className={cn("flex h-9 w-full items-center justify-between gap-2 px-3 text-left text-[#17324d] hover:bg-[#eef3f8]", open && "bg-[#eef3f8]")}>
        <span className="flex items-center gap-2.5"><span className="grid h-4 w-4 place-items-center text-[#6d8294]"><PlusColIcon /></span>{label}</span>
        <span className="text-lg leading-none text-[#17324d]">›</span>
      </button>
      {open && (
        <div className="absolute left-full top-0 z-50 ml-1 w-[276px] rounded-sm border border-[#d5dde5] bg-white shadow-[0_12px_24px_rgba(31,50,70,0.2)]">
          <div className="flex h-11 items-center justify-between border-b border-[#edf1f5] px-3">
            <p className="text-sm font-semibold text-[#17324d]">Select field</p>
            <button type="button" className="inline-flex items-center gap-1 text-sm font-medium text-[#1f63d6] hover:text-[#0b4fb3]">
              <CirclePlusIcon /> Add new field
            </button>
          </div>
          <div className="p-3 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#54708a]" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search fields" className="h-9 w-full rounded-sm border border-[#c8d6e3] bg-white pl-8 pr-3 text-sm text-[#17324d] outline-none placeholder:text-[#9aaabc] focus:border-[#73a7df] focus:ring-1 focus:ring-[#73a7df]" autoFocus />
            </div>
          </div>
          <div className="max-h-[318px] overflow-y-auto px-3 pb-3">
            <FieldGroup title="Basic information" columns={basicFields} side={side} onPick={onPick} disabledKeys={new Set(COLUMNS.filter((c) => !hiddenColumns.some((h) => h.key === c.key)).map((c) => c.key))} />
            <FieldGroup title="Hidden fields" columns={filtered} side={side} onPick={onPick} />
          </div>
        </div>
      )}
    </div>
  );
}

function FieldGroup({ title, columns, side, disabledKeys, onPick }: {
  title: string;
  columns: { key: ColumnKey; label: string }[];
  side: "left" | "right";
  disabledKeys?: Set<ColumnKey>;
  onPick: (key: ColumnKey, side: "left" | "right") => void;
}) {
  if (!columns.length) {
    return title === "Hidden fields" ? <p className="px-2 py-3 text-sm text-[#7a8da0]">All columns are already shown</p> : null;
  }

  return (
    <div className="pt-2">
      <p className="mb-1 px-2 text-sm font-semibold text-[#17324d]">{title}</p>
      {columns.map((c) => {
        const disabled = disabledKeys?.has(c.key);
        return (
          <button
            key={`${title}-${c.key}`}
            type="button"
            onClick={() => !disabled && onPick(c.key, side)}
            disabled={disabled}
            className={cn("block h-8 w-full rounded-sm px-2 text-left text-sm text-[#17324d] hover:bg-[#eef3f8]", disabled && "cursor-not-allowed text-[#9aaabc] hover:bg-transparent")}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

function Divider() { return <div className="my-1 border-t border-[#e2e8ee]" />; }
function SortArrow({ dir }: { dir: "asc" | "desc" }) { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3463ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">{dir === "asc" ? <path d="M18 15l-6-6-6 6" /> : <path d="M6 9l6 6 6-6" />}</svg>; }
function CaretDown() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z" /></svg>; }
function ArrowIcon({ up }: { up?: boolean }) { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{up ? <><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></> : <><path d="M12 5v14" /><path d="M19 12l-7 7-7-7" /></>}</svg>; }
function PlusColIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>; }
function CirclePlusIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>; }
function CollapseIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 7l-4 5 4 5M16 7l4 5-4 5" /></svg>; }
function RemoveIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14" /></svg>; }
function GridIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>; }
function FilterIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h18l-7 8v6l-4 2v-8z" /></svg>; }

const SORT_ACCESSOR: Record<ColumnKey, (l: any) => string | number | null> = {
  leadId: (l) => leadCode(l.id),
  name: (l) => l.full_name,
  mobile: (l) => l.phone,
  email: (l) => l.email,
  country: (l) => leadCountry(l),
  status: (l) => LEAD_STATUS_ORDER.indexOf(l.status),
  pipelineStatus: (l) => LEAD_PIPELINE_STATUS_ORDER.indexOf(l.pipeline_status ?? "contacted"),
  priority: (l) => ({ hot: 0, warm: 1, cold: 2 } as Record<string, number>)[l.priority] ?? 3,
  project: (l) => l.project?.name ?? null,
  budget: (l) => Number(l.budget ?? 0),
  source: (l) => l.source?.name ?? null,
  owner: (l) => l.owner?.full_name ?? null,
  manager: (l) => l.manager?.full_name ?? null,
  siteVisitDone: (l) => siteVisitCounts(l).done,
  siteVisitPending: (l) => siteVisitCounts(l).pending,
  obmDone: (l) => obmCounts(l).done,
  obmPending: (l) => obmCounts(l).pending,
  lastActivityType: (l) => latestActivity(l)?.type ?? null,
  lastActivityAt: (l) => latestActivityDate(l)?.getTime() ?? 0,
  assignedAt: (l) => assignedAt(l)?.getTime() ?? 0,
  assignedBy: (l) => l.creator?.full_name ?? null,
  createdAt: (l) => l.created_at ? new Date(l.created_at).getTime() : 0,
  score: (l) => Number(l.score ?? 0),
};

function parseSort(params: URLSearchParams): LeadSort | null {
  const key = params.get("sort") as ColumnKey | null;
  const dir = params.get("sort_dir") === "desc" ? "desc" : "asc";
  return key && COLUMN_KEYS.has(key) ? { key, dir } : null;
}

function sortLeads(rows: any[], sort: LeadSort | null) {
  if (!sort) return rows;
  const acc = SORT_ACCESSOR[sort.key];
  const direction = sort.dir === "desc" ? -1 : 1;
  const sorted = [...rows].sort((a, b) => {
    const va = acc(a), vb = acc(b);
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === "number" && typeof vb === "number") return (va - vb) * direction;
    return String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: "base" }) * direction;
  });
  return sorted;
}

function leadCode(id?: string) {
  return id ? id.replace(/\D/g, "").slice(0, 12).padEnd(12, "0") : "-";
}

function leadCountry(lead: any) {
  return lead.country ?? (lead.city || lead.location ? "India" : "-");
}

function formatDateTime(value?: string | Date | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function labelize(value?: string | null) {
  if (!value) return "-";
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function siteVisitCounts(lead: any) {
  const visits = lead.site_visits ?? [];
  // Site-visit tasks count too (completing one auto-advances the pipeline).
  const svTasks = (lead.tasks ?? []).filter((task: any) => task.type === "site_visit");
  const pipelineDone = (lead.pipeline_status === "site_visit_done" || lead.pipeline_status === "re_site_visit") ? 1 : 0;
  return {
    done: visits.filter((visit: any) => visit.status === "completed").length
      + svTasks.filter((task: any) => task.status === "completed").length + pipelineDone,
    pending: visits.filter((visit: any) => ["scheduled", "no_show"].includes(visit.status)).length
      + svTasks.filter((task: any) => !["completed", "cancelled"].includes(task.status)).length,
  };
}

function obmCounts(lead: any) {
  const meetings = (lead.tasks ?? []).filter((task: any) => task.type === "meeting");
  const statusDone = lead.status === "obm_visit_done" ? 1 : 0;
  const statusPending = ["obm_visit", "re_obm", "repeat_obm"].includes(lead.status) ? 1 : 0;
  return {
    done: meetings.filter((task: any) => task.status === "completed").length + statusDone,
    pending: meetings.filter((task: any) => !["completed", "cancelled"].includes(task.status)).length + statusPending,
  };
}

function latestActivity(lead: any) {
  return lead.activities?.[0] ?? null;
}

function latestActivityDate(lead: any) {
  const activity = latestActivity(lead);
  if (activity?.created_at) return new Date(activity.created_at);
  return lead.last_activity_at ? new Date(lead.last_activity_at) : null;
}

function assignedAt(lead: any) {
  if (!lead.owner_id) return null;
  return lead.updated_at ? new Date(lead.updated_at) : lead.created_at ? new Date(lead.created_at) : null;
}

function CountCell({ value }: { value: number }) {
  return <span className={cn("inline-flex min-w-7 justify-center rounded-full px-2 py-0.5 text-xs font-semibold", value > 0 ? "bg-brand-50 text-brand-700" : "bg-ink-50 text-ink-400")}>{value}</span>;
}

function RowGroup({ group, showHeader, selected, visibleColumns, rowHeight, owners, projects, onToggleLead, onRowHeightChange, onUpdateLead }: {
  group: { key: string; label: string; rows: any[] };
  showHeader: boolean;
  selected: Set<string>;
  visibleColumns: Record<ColumnKey, boolean>;
  rowHeight: number;
  owners: { id: string; full_name: string }[];
  projects: LeadFormOption[];
  onToggleLead: (id: string) => void;
  onRowHeightChange: (height: number) => void;
  onUpdateLead: (id: string, patch: Record<string, any>) => Promise<void>;
}) {
  return (
    <>
      {showHeader && (
        <tr className="bg-ink-50">
          <td colSpan={COLUMNS.length + 2} className={`${GRID_BORDER} bg-ink-50 px-4 py-2 text-xs font-semibold text-ink-600`}>
            {group.label} <span className="ml-1 rounded-full bg-white px-1.5 py-0.5 text-ink-400">{group.rows.length}</span>
          </td>
        </tr>
      )}
      {group.rows.map((lead) => (
        <LeadRow
          key={lead.id}
          lead={lead}
          checked={selected.has(lead.id)}
          visibleColumns={visibleColumns}
          rowHeight={rowHeight}
          owners={owners}
          projects={projects}
          onToggle={() => onToggleLead(lead.id)}
          onRowHeightChange={onRowHeightChange}
          onUpdateLead={onUpdateLead}
        />
      ))}
    </>
  );
}

function LeadRow({ lead, checked, visibleColumns, rowHeight, owners, projects, onToggle, onRowHeightChange, onUpdateLead }: {
  lead: any;
  checked: boolean;
  visibleColumns: Record<ColumnKey, boolean>;
  rowHeight: number;
  owners: { id: string; full_name: string }[];
  projects: LeadFormOption[];
  onToggle: () => void;
  onRowHeightChange: (height: number) => void;
  onUpdateLead: (id: string, patch: Record<string, any>) => Promise<void>;
}) {
  const [editor, setEditor] = useState<ColumnKey | null>(null);
  function onPointerDown(e: React.PointerEvent<HTMLSpanElement>) {
    const startY = e.clientY;
    const startHeight = rowHeight;
    const move = (event: PointerEvent) => onRowHeightChange(Math.max(36, startHeight + event.clientY - startY));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <tr className={cn("group/row transition hover:bg-[#f4f8fb]", checked && "bg-[#e6f2ff]")} style={{ height: rowHeight }}>
      <td className={`relative ${GRID_BORDER} px-3 py-2`}>
        <input checked={checked} onChange={onToggle} type="checkbox" className="h-4 w-4 rounded border-ink-300" />
        <span onPointerDown={onPointerDown} title="Drag to resize rows" className="absolute bottom-0 left-0 h-1 w-full cursor-row-resize hover:bg-brand-300" />
      </td>
      {visibleColumns.leadId && <td className={`${BODY_CELL} font-mono text-xs text-brand-700`}>{leadCode(lead.id)}</td>}
      {visibleColumns.name && <td className={BODY_CELL}><NameCell lead={lead} /></td>}
      {visibleColumns.mobile && <td className={BODY_CELL}><EditableCell open={editor === "mobile"} onOpen={() => setEditor("mobile")} onClose={() => setEditor(null)}><a className="text-brand-600 hover:underline" href={`tel:${lead.phone ?? ""}`}>{lead.phone ?? "-"}</a><TextEditor label="Mobile" value={lead.phone ?? ""} onSave={(phone) => onUpdateLead(lead.id, { phone })} /></EditableCell></td>}
      {visibleColumns.email && <td className={BODY_CELL}><EditableCell open={editor === "email"} onOpen={() => setEditor("email")} onClose={() => setEditor(null)}><span className="block truncate text-brand-600">{lead.email ?? "-"}</span><TextEditor label="Email" value={lead.email ?? ""} onSave={(email) => onUpdateLead(lead.id, { email })} /></EditableCell></td>}
      {visibleColumns.country && <td className={`${BODY_CELL} text-ink-600`}>{leadCountry(lead)}</td>}
      {visibleColumns.status && <td className={BODY_CELL}><EditableCell open={editor === "status"} onOpen={() => setEditor("status")} onClose={() => setEditor(null)}><StatusBadge status={lead.status} /><SelectEditor label="Status" value={lead.status ?? "new"} options={LEAD_STATUS_ORDER.map((id) => ({ id, name: LEAD_STATUS[id].label }))} onSave={(status) => onUpdateLead(lead.id, { status })} /></EditableCell></td>}
      {visibleColumns.source && <td className={`${BODY_CELL} text-ink-600`}>{lead.source?.name ?? "-"}</td>}
      {visibleColumns.pipelineStatus && <td className={BODY_CELL}><PipelineStatusBadge status={lead.pipeline_status ?? "contacted"} /></td>}
      {visibleColumns.owner && <td className={BODY_CELL}><EditableCell open={editor === "owner"} onOpen={() => setEditor("owner")} onClose={() => setEditor(null)}>{lead.owner?.full_name ? <span className="flex items-center gap-2"><Avatar name={lead.owner.full_name} size="xs" /><span className="text-ink-600">{lead.owner.full_name.split(" ")[0]}</span></span> : <span className="text-ink-400">Unassigned</span>}<SelectEditor label="Lead owner" value={lead.owner_id ?? ""} options={owners.map((o) => ({ id: o.id, name: o.full_name }))} onSave={(owner_id) => onUpdateLead(lead.id, { owner_id })} /></EditableCell></td>}
      {visibleColumns.manager && <td className={`${BODY_CELL} text-ink-600`}>{lead.manager?.full_name ?? "-"}</td>}
      {visibleColumns.siteVisitDone && <td className={BODY_CELL}><CountCell value={siteVisitCounts(lead).done} /></td>}
      {visibleColumns.siteVisitPending && <td className={BODY_CELL}><CountCell value={siteVisitCounts(lead).pending} /></td>}
      {visibleColumns.obmDone && <td className={BODY_CELL}><CountCell value={obmCounts(lead).done} /></td>}
      {visibleColumns.obmPending && <td className={BODY_CELL}><CountCell value={obmCounts(lead).pending} /></td>}
      {visibleColumns.lastActivityType && <td className={`${BODY_CELL} text-ink-600`}>{labelize(latestActivity(lead)?.type)}</td>}
      {visibleColumns.lastActivityAt && <td className={`${BODY_CELL} text-xs text-ink-500`}>{formatDateTime(latestActivityDate(lead))}</td>}
      {visibleColumns.assignedAt && <td className={`${BODY_CELL} text-xs text-ink-500`}>{formatDateTime(assignedAt(lead))}</td>}
      {visibleColumns.assignedBy && <td className={`${BODY_CELL} text-ink-600`}>{lead.creator?.full_name ?? "-"}</td>}
      {visibleColumns.createdAt && <td className={`${BODY_CELL} text-xs text-ink-500`}>{formatDateTime(lead.created_at)}</td>}
      {visibleColumns.priority && <td className={BODY_CELL}><PriorityBadge priority={lead.priority} /></td>}
      {visibleColumns.project && <td className={`${BODY_CELL} text-ink-600`}><EditableCell open={editor === "project"} onOpen={() => setEditor("project")} onClose={() => setEditor(null)}><span className="inline-flex items-center gap-2"><Building2 className="h-4 w-4 text-ink-300" />{lead.project?.name ?? "-"}</span><SelectEditor label="Project" value={lead.project_id ?? ""} options={projects} onSave={(project_id) => onUpdateLead(lead.id, { project_id })} /></EditableCell></td>}
      {visibleColumns.budget && <td className={`${BODY_CELL} font-medium text-ink-700`}>{formatCurrency(lead.budget)}</td>}
      {visibleColumns.score && <td className={BODY_CELL}><ScoreCell score={lead.score} /></td>}
      <td className={`${GRID_BORDER} px-3 py-2`}><RowMenu lead={lead} /></td>
    </tr>
  );
}

function NameCell({ lead }: { lead: any }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Link href={`/leads/${lead.id}`} className="group flex min-w-0 flex-1 items-center gap-2.5">
        <Avatar name={lead.full_name} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900 group-hover:text-brand-600">{lead.full_name}</p>
          <p className="truncate text-xs text-ink-400">{lead.city ?? lead.project?.name ?? "-"}</p>
        </div>
      </Link>
      <div className="hidden shrink-0 items-center gap-1 group-hover/row:flex">
        <IconLink title="Open" href={`/leads/${lead.id}`} icon={ExternalLink} />
        <IconLink title="Email" href={`mailto:${lead.email ?? ""}`} icon={Mail} />
        <IconLink title="Call" href={`tel:${lead.phone ?? ""}`} icon={Phone} />
        <button title="Add task" className="rounded p-1 text-ink-400 hover:bg-white hover:text-brand-600"><CalendarPlus className="h-3.5 w-3.5" /></button>
        <button title="Add note" className="rounded p-1 text-ink-400 hover:bg-white hover:text-brand-600"><FileText className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}

function PipelineStatusBadge({ status }: { status: string }) {
  const meta = LEAD_PIPELINE_STATUS[status] ?? LEAD_PIPELINE_STATUS.contacted;
  return (
    <span className={cn("badge", meta.bg)}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

function IconLink({ title, href, icon: Icon }: { title: string; href: string; icon: any }) {
  return <Link title={title} href={href} className="rounded p-1 text-ink-400 hover:bg-white hover:text-brand-600"><Icon className="h-3.5 w-3.5" /></Link>;
}

function EditableCell({ open, onOpen, onClose, children }: { open: boolean; onOpen: () => void; onClose: () => void; children: [React.ReactNode, React.ReactNode] }) {
  return (
    <div className="relative min-w-0">
      <button onClick={onOpen} className="flex w-full min-w-0 items-center justify-between gap-2 text-left">
        <span className="min-w-0 truncate">{children[0]}</span>
        <Edit3 className="h-3.5 w-3.5 shrink-0 text-ink-300 opacity-0 group-hover/row:opacity-100" />
      </button>
      {open && (
        <div className="absolute left-0 top-8 z-40 min-w-[280px] rounded-lg border border-ink-100 bg-white p-3 shadow-pop">
          {children[1]}
          <button onClick={onClose} className="absolute right-2 top-2 rounded p-1 text-ink-400 hover:bg-ink-50"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}
    </div>
  );
}

function TextEditor({ label, value, onSave }: { label: string; value: string; onSave: (value: string) => Promise<void> }) {
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  return (
    <div className="space-y-3">
      <label className="block pr-8">
        <span className="label">{label}</span>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} className="input h-9" autoFocus />
      </label>
      <EditorActions saving={saving} onSave={async () => { setSaving(true); await onSave(draft); setSaving(false); }} />
    </div>
  );
}

function SelectEditor({ label, value, options, onSave }: { label: string; value: string; options: { id: string; name: string }[]; onSave: (value: string | null) => Promise<void> }) {
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  return (
    <div className="space-y-3">
      <label className="block pr-8">
        <span className="label">{label}</span>
        <select value={draft} onChange={(e) => setDraft(e.target.value)} className="input h-9" autoFocus>
          <option value="">None</option>
          {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
        </select>
      </label>
      <EditorActions saving={saving} onSave={async () => { setSaving(true); await onSave(draft || null); setSaving(false); }} />
    </div>
  );
}

function EditorActions({ saving, onSave }: { saving: boolean; onSave: () => Promise<void> }) {
  return (
    <div className="flex justify-end gap-2 border-t border-ink-100 pt-3">
      <button onClick={onSave} disabled={saving} className="btn-primary h-8">{saving ? "Saving..." : "Save"}</button>
    </div>
  );
}

function RowMenu({ lead }: { lead: any }) {
  const [open, setOpen] = useState(false);
  const items = [
    ["Edit all fields", Edit3],
    ["Add meeting", CalendarPlus],
    ["Add call log", Phone],
    ["Send SMS to mobile", MessageSquare],
    ["Clone", Copy],
    ["Delete", Trash2],
    ["Unsubscribe", UserX],
    ["Forget", ClipboardList],
  ] as const;
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"><MoreVertical className="h-4 w-4" /></button>
      {open && (
        <div className="absolute right-0 top-7 z-40 w-52 rounded-lg border border-ink-100 bg-white py-1 shadow-pop">
          {items.map(([label, Icon]) => (
            <button key={label} onClick={() => setOpen(false)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-700 hover:bg-brand-50">
              <Icon className="h-4 w-4 text-ink-500" /> {label}
            </button>
          ))}
          <Link href={`/leads/${lead.id}`} className="flex items-center gap-2 border-t border-ink-100 px-3 py-2 text-sm text-brand-700 hover:bg-brand-50">
            <ExternalLink className="h-4 w-4" /> Open lead
          </Link>
        </div>
      )}
    </div>
  );
}

function ScoreCell({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-ink-100">
        <span className="block h-full bg-brand-500" style={{ width: `${score}%` }} />
      </span>
      <span className="text-xs text-ink-500">{score}</span>
    </span>
  );
}

function CustomizeDrawer({ visibleColumns, onChange, onReset, onClose }: {
  visibleColumns: Record<ColumnKey, boolean>;
  onChange: (next: Record<ColumnKey, boolean>) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-ink-100 bg-white shadow-pop">
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
        <p className="font-semibold text-ink-900">Customize table</p>
        <button onClick={onClose} className="btn-ghost h-8 w-8 p-0"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <p className="mb-3 text-xs font-medium text-ink-500">Show columns</p>
        <div className="space-y-1">
          {COLUMNS.map((column) => (
            <label key={column.key} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-50">
              <span className="flex items-center gap-2"><GripVertical className="h-4 w-4 text-ink-300" />{column.label}</span>
              <input
                type="checkbox"
                checked={visibleColumns[column.key]}
                onChange={(e) => onChange({ ...visibleColumns, [column.key]: e.target.checked })}
                className="h-4 w-4 rounded border-ink-300"
              />
            </label>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-ink-100 p-4">
        <button onClick={onReset} className="btn-outline h-9">Reset</button>
        <button onClick={onClose} className="btn-primary h-9">Done</button>
      </div>
    </div>
  );
}

function groupLeads(leads: any[], groupBy: LeadGroupBy | null) {
  if (!groupBy) return [{ key: "all", label: "All leads", rows: leads }];
  const map = new Map<string, any[]>();
  leads.forEach((lead) => {
    const label = groupLabel(lead, groupBy);
    map.set(label, [...(map.get(label) ?? []), lead]);
  });
  return [...map.entries()].map(([label, rows]) => ({ key: label, label, rows }));
}

function groupLabel(lead: any, groupBy: LeadGroupBy) {
  if (groupBy === "owner") return lead.owner?.full_name ?? "Unassigned";
  if (groupBy === "source") return lead.source?.name ?? "No source";
  if (groupBy === "project") return lead.project?.name ?? "No project";
  if (groupBy === "priority") return `${lead.priority?.charAt(0).toUpperCase()}${lead.priority?.slice(1)}`;
  return lead.status?.replaceAll("_", " ") ?? "No status";
}
