"use client";

import { useState, useRef, useEffect } from "react";
import {
  BarChart3, PieChart, LineChart, Activity, Grid3x3, Table2, Filter,
  Maximize2, MoreVertical, Download, Mail, ChevronDown, ChevronRight, Hash, X, MoveDiagonal2,
  GripVertical, Minimize2, TrendingUp, TrendingDown, Users, Target, Flame, Sparkles,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import {
  ApexBar, ApexHBar, ApexDonut, ApexPie, ApexLine, ApexArea, ApexFunnel,
  ApexHeatmap, ApexGrouped,
} from "./apex";

export type ChartType =
  | "bar" | "hbar" | "donut" | "pie" | "line" | "area" | "funnel"
  | "heatmap" | "grouped" | "stacked" | "table";

export interface GroupedKey { key: string; label: string; color: string }
type UnderlyingData = {
  columns: { key: string; label: string; align?: "left" | "right"; filter?: "text" | "number" | "date" }[];
  rows: Record<string, any>[];
};

const META: Record<ChartType, { label: string; icon: any }> = {
  bar: { label: "Bar chart", icon: BarChart3 },
  hbar: { label: "Horizontal bar chart", icon: BarChart3 },
  donut: { label: "Donut chart", icon: PieChart },
  pie: { label: "Pie chart", icon: PieChart },
  line: { label: "Line chart", icon: LineChart },
  area: { label: "Area chart", icon: Activity },
  funnel: { label: "Funnel", icon: Filter },
  heatmap: { label: "Heat map", icon: Grid3x3 },
  grouped: { label: "Grouped bar chart", icon: BarChart3 },
  stacked: { label: "Stacked bar chart", icon: BarChart3 },
  table: { label: "Summary table", icon: Table2 },
};

export const SINGLE_TYPES: ChartType[] = ["bar", "hbar", "donut", "pie", "line", "area", "heatmap", "table"];
export const GROUPED_TYPES: ChartType[] = ["grouped", "stacked", "table"];

type Fmt = "currency" | "number" | "percent" | "lakh";

interface Props {
  id: string;
  title: string;
  data: any[];
  kind: "single" | "grouped" | "kpi";
  defaultType: ChartType;
  types?: ChartType[];
  groupedKeys?: GroupedKey[];
  underlyingData?: UnderlyingData;
  format?: Fmt;
  kpi?: { value: number; tone: "green" | "red" | "blue" };
  className?: string;
  onRemove?: () => void;
  chartHeight?: number;
  size?: { cols: number; rows: number };
  onResize?: (size: { cols: number; rows: number }) => void;
  onMoveStart?: (event: React.DragEvent<HTMLButtonElement>) => void;
  onMoveOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onMoveDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
  onMoveEnd?: () => void;
}

function fmtVal(v: number, f?: Fmt) {
  if (f === "currency") return formatCurrency(v);
  if (f === "percent") return `${v}%`;
  if (f === "lakh") return `₹${v} L`;
  return v?.toLocaleString("en-IN");
}

function kpiText(v: number, f?: Fmt, compact = true) {
  if (f === "percent") return `${v}%`;
  if (f === "number") return v.toLocaleString("en-IN");
  return compact ? formatCurrency(v) : `₹${v.toLocaleString("en-IN")}`;
}

export function ChartWidget(props: Props) {
  const {
    id, title, data, kind, defaultType, groupedKeys, underlyingData, format, kpi, className, onRemove,
    chartHeight = 240, size, onResize, onMoveStart, onMoveOver, onMoveDrop, onMoveEnd,
  } = props;
  const storageKey = `dash:w:${id}:type`;
  const [type, setType] = useState<ChartType>(defaultType);
  const [compact, setCompact] = useState(true);
  const [expandChart, setExpandChart] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [dataFilterOpen, setDataFilterOpen] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    const allowedTypes = props.types ?? (kind === "grouped" ? GROUPED_TYPES : SINGLE_TYPES);
    if (saved && allowedTypes.includes(saved as ChartType)) setType(saved as ChartType);
    if (saved && !allowedTypes.includes(saved as ChartType)) {
      setType(defaultType);
      try { localStorage.setItem(storageKey, defaultType); } catch {}
    }
  }, [storageKey]);

  function choose(t: ChartType) {
    setType(t);
    try { localStorage.setItem(storageKey, t); } catch {}
  }

  const allowed = props.types ?? (kind === "grouped" ? GROUPED_TYPES : SINGLE_TYPES);
  const activeType = allowed.includes(type) ? type : defaultType;

  function downloadCsv(kind: "graph" | "tabular" = "tabular") {
    const rows = kind === "graph" ? graphCsvRows(data, groupedKeys) : tabularCsvRows(data, groupedKeys, underlyingData);
    downloadRows(rows, `${title}-${kind}.csv`);
  }

  function exportEmail(kind: "graph" | "tabular" = "tabular") {
    const rows = kind === "graph" ? graphCsvRows(data, groupedKeys) : tabularCsvRows(data, groupedKeys, underlyingData);
    const body = rowsToCsv(rows).slice(0, 1800);
    const subject = `${title} ${kind} export`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function printGraphPdf() {
    printRows(title, graphCsvRows(data, groupedKeys), "Graph data");
  }

  return (
    <div
      onDragOver={onMoveOver}
      onDrop={onMoveDrop}
      onDragEnd={onMoveEnd}
      className={cn(
        "flex flex-col group/widget relative rounded-lg border border-[#d9e2ec] bg-white p-3.5 shadow-none transition-[opacity,border-color,box-shadow] duration-300 ease-out hover:border-[#bfd0df] hover:shadow-[0_12px_28px_-18px_rgba(16,24,40,0.55)]",
        className,
      )}
    >
      <div className="mb-2 flex items-start justify-between">
        <div className="flex min-w-0 items-start gap-1.5">
          {onMoveStart && (
            <button
              type="button"
              draggable
              title="Drag to move widget"
              onDragStart={onMoveStart}
              onDragEnd={onMoveEnd}
              className="-ml-1 grid h-7 w-6 shrink-0 cursor-grab place-items-center rounded text-ink-300 transition hover:bg-[#eef4f9] hover:text-brand-600 active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <h3 className="min-w-0 pr-2 text-sm font-semibold text-[#092f4f]">{title}</h3>
        </div>
        <div className="flex items-center gap-0.5 opacity-100 transition md:opacity-0 md:group-hover/widget:opacity-100">
          {kind === "kpi" ? (
            <IconBtn title="Number format" onClick={() => setCompact((c) => !c)}><Hash className="h-4 w-4" /></IconBtn>
          ) : (
            <TypeMenu current={activeType} allowed={allowed} onChoose={choose} />
          )}
          <IconBtn title="View underlying data" onClick={() => { setDataFilterOpen(false); setDataOpen(true); }}><Table2 className="h-4 w-4" /></IconBtn>
          {kind !== "kpi" && <IconBtn title="Expand" onClick={() => setExpandChart(true)}><Maximize2 className="h-4 w-4" /></IconBtn>}
          <MoreMenu
            onFilters={() => { setDataFilterOpen(true); setDataOpen(true); }}
            onEmailGraph={() => exportEmail("graph")}
            onEmailTabular={() => exportEmail("tabular")}
            onDownloadGraph={() => downloadCsv("graph")}
            onDownloadTabular={() => downloadCsv("tabular")}
            onDownloadPdf={printGraphPdf}
          />
          {onRemove && <IconBtn title="Remove widget" onClick={onRemove}><X className="h-4 w-4" /></IconBtn>}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {kind === "kpi" && kpi ? (
          <KpiCard title={title} valueText={kpiText(kpi.value, format, compact)} value={kpi.value} tone={kpi.tone} format={format} />
        ) : (
          renderChart(activeType, data, groupedKeys, format, false, chartHeight)
        )}
      </div>

      {size && onResize && <ResizeHandle size={size} onResize={onResize} />}

      {expandChart && (
        <ExpandModal title={title} onClose={() => setExpandChart(false)}>
          <div className="h-[60vh]">{renderChart(activeType, data, groupedKeys, format, true)}</div>
        </ExpandModal>
      )}

      {dataOpen && (
        <UnderlyingDataModal
          title={title}
          data={data}
          groupedKeys={groupedKeys}
          underlyingData={underlyingData}
          format={format}
          initialFilterOpen={dataFilterOpen}
          onExport={() => downloadCsv("tabular")}
          onClose={() => setDataOpen(false)}
        />
      )}
    </div>
  );
}

/* ---------- premium KPI tile ---------- */

const KPI_TONES: Record<"green" | "red" | "blue", { text: string; chip: string; grad: string; bar: string }> = {
  green: { text: "text-emerald-500", chip: "bg-emerald-50 text-emerald-600", grad: "from-emerald-600 to-emerald-400", bar: "bg-emerald-500" },
  red: { text: "text-red-400", chip: "bg-red-50 text-red-500", grad: "from-red-500 to-rose-400", bar: "bg-red-500" },
  blue: { text: "text-brand-400", chip: "bg-brand-50 text-brand-600", grad: "from-brand-600 to-brand-400", bar: "bg-brand-500" },
};

function kpiVisual(title: string): { Icon: any; caption: string } {
  const t = title.toLowerCase();
  if (t.includes("lost")) return { Icon: TrendingDown, caption: "Closed lost" };
  if (t.includes("won")) return { Icon: TrendingUp, caption: "Closed won" };
  if (t.includes("conversion") || t.includes("ratio")) return { Icon: Target, caption: "Lead to deal" };
  if (t.includes("hot")) return { Icon: Flame, caption: "High priority" };
  if (t.includes("today") || t.includes("new")) return { Icon: Sparkles, caption: "Added today" };
  if (t.includes("revenue")) return { Icon: TrendingUp, caption: "Revenue" };
  if (t.includes("lead") || t.includes("contact")) return { Icon: Users, caption: "Total records" };
  return { Icon: TrendingUp, caption: "" };
}

function KpiCard({ title, valueText, value, tone, format }: { title: string; valueText: string; value: number; tone: "green" | "red" | "blue"; format?: Fmt }) {
  const { Icon, caption } = kpiVisual(title);
  const c = KPI_TONES[tone];
  const isPercent = format === "percent";
  const pct = isPercent ? Math.max(0, Math.min(100, value)) : null;
  return (
    <div className="relative flex h-full min-h-[104px] flex-col items-center justify-center overflow-hidden text-center">
      <Icon aria-hidden className={cn("pointer-events-none absolute -right-2 -top-2 h-20 w-20 opacity-[0.06]", c.text)} />

      {/* Centered tone icon chip */}
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", c.chip)}>
        <Icon className="h-[18px] w-[18px]" />
      </span>

      {/* Centered value + caption */}
      <p className={cn("mt-3 bg-gradient-to-br bg-clip-text pb-0.5 text-[1.75rem] font-bold leading-none tracking-tight text-transparent", c.grad)}>
        {valueText}
      </p>
      {caption && <p className="mt-1.5 text-xs font-medium text-ink-400">{caption}</p>}

      <div className="mt-3.5 h-1.5 w-24 overflow-hidden rounded-full bg-ink-100">
        <div className={cn("h-full rounded-full transition-[width] duration-500 ease-out", c.bar)} style={{ width: pct !== null ? `${pct}%` : "100%", opacity: pct !== null ? 1 : 0.45 }} />
      </div>
    </div>
  );
}

function tabularCsvRows(data: any[], groupedKeys?: GroupedKey[], underlyingData?: UnderlyingData) {
  if (underlyingData) {
    return [
      underlyingData.columns.map((column) => column.label),
      ...underlyingData.rows.map((row) => underlyingData.columns.map((column) => String(row[column.key] ?? ""))),
    ];
  }
  if (groupedKeys) {
    return [["Name", ...groupedKeys.map((k) => k.label)], ...data.map((d) => [d.name, ...groupedKeys.map((k) => String(d[k.key] ?? 0))])];
  }
  return [["Name", "Value"], ...data.map((d) => [d.name, String(d.value ?? 0)])];
}

function graphCsvRows(data: any[], groupedKeys?: GroupedKey[]) {
  if (groupedKeys) {
    return [["Name", ...groupedKeys.map((k) => k.label)], ...data.map((d) => [d.name, ...groupedKeys.map((k) => String(d[k.key] ?? 0))])];
  }
  return [["Name", "Value"], ...data.map((d) => [d.name, String(d.value ?? 0)])];
}

function rowsToCsv(rows: string[][]) {
  return rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
}

function downloadRows(rows: string[][], filename: string) {
  const csv = rowsToCsv(rows);
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.replace(/[^\w.-]+/g, "_").toLowerCase();
  a.click();
  URL.revokeObjectURL(url);
}

function printRows(title: string, rows: string[][], label: string) {
  const popup = window.open("", "_blank", "width=960,height=720");
  if (!popup) {
    window.print();
    return;
  }
  const safe = (value: string) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char] ?? char));
  popup.document.write(`<!doctype html><html><head><title>${safe(title)} ${safe(label)}</title><style>
    body{font-family:Arial,sans-serif;color:#092f4f;margin:24px}
    h1{font-size:18px;margin:0 0 4px}
    p{font-size:12px;color:#58708a;margin:0 0 18px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th,td{border:1px solid #d9e2ec;padding:9px 10px;text-align:left}
    th{background:#f6f9fc;font-weight:600}
  </style></head><body><h1>${safe(title)}</h1><p>${safe(label)}</p><table><thead><tr>${rows[0].map((cell) => `<th>${safe(cell)}</th>`).join("")}</tr></thead><tbody>${rows.slice(1).map((row) => `<tr>${row.map((cell) => `<td>${safe(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table><script>window.onload=()=>{window.print();};</script></body></html>`);
  popup.document.close();
}

function renderChart(type: ChartType, data: any[], keys?: GroupedKey[], format?: Fmt, big = false, chartHeight = 240) {
  const h = big ? 420 : chartHeight;
  switch (type) {
    case "bar":
      return <ApexBar data={data} height={h} />;
    case "hbar":
      return <ApexHBar data={data} height={h} />;
    case "donut":
      return <ApexDonut data={withColors(data)} height={h} />;
    case "pie":
      return <ApexPie data={withColors(data)} height={h} />;
    case "line":
      return <ApexLine data={data} height={h} />;
    case "area":
      return <ApexArea data={data} height={h} />;
    case "funnel":
      return <ApexFunnel data={withColors(data)} height={h} />;
    case "heatmap":
      return <ApexHeatmap data={data} height={h} />;
    case "grouped":
      return keys ? <ApexGrouped data={data} keys={keys} height={h} /> : <ApexBar data={data} height={h} />;
    case "stacked":
      return keys ? <ApexGrouped data={data} keys={keys} height={h} stacked /> : <ApexBar data={data} height={h} />;
    case "table":
      return <DataTable data={data} groupedKeys={keys} format={format} />;
    default:
      return <ApexBar data={data} height={h} />;
  }
}

const PALETTE = ["#3463ff", "#ec4899", "#8b5cf6", "#f59e0b", "#10b981", "#0ea5e9", "#ef4444", "#14b8a6", "#64748b"];
const withColors = (data: any[]) => data.map((d, i) => ({ ...d, color: d.color || PALETTE[i % PALETTE.length] }));

/* ---------- inline renderers ---------- */

function DataTable({ data, groupedKeys, format }: { data: any[]; groupedKeys?: GroupedKey[]; format?: Fmt }) {
  if (!data.length) return <div className="grid h-full place-items-center text-sm text-ink-400">No data</div>;
  const rows = buildUnderlyingRows(data, groupedKeys, format);
  return (
    <div className="overflow-auto max-h-full rounded border border-[#d9e2ec]">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <thead className="bg-[#f6f9fc]">
          <tr className="text-left text-xs font-semibold text-[#29465f]">
            {rows.columns.filter((column) => column.key !== "rowNumber").map((column) => (
              <th key={column.key} className={cn("border-b border-r border-[#d9e2ec] px-3 py-3", column.align === "right" && "text-right")}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.rows.map((row) => (
            <tr key={row.__rowId} className="hover:bg-[#f8fbfd]">
              {rows.columns.filter((column) => column.key !== "rowNumber").map((column) => (
                <td key={column.key} className={cn("border-b border-r border-[#d9e2ec] px-3 py-3 text-[#29465f]", column.align === "right" && "text-right font-medium text-[#092f4f]")}>
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
          <tr className="bg-[#edf2f7] font-semibold text-[#092f4f]">
            {summaryCells(rows.columns.filter((column) => column.key !== "rowNumber"), rows.rawRows).map((cell) => (
              <td key={cell.key} className={cn("border-r border-[#d9e2ec] px-3 py-3", cell.align === "right" && "text-right")}>{cell.value}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

type DataColumn = { key: string; label: string; align?: "left" | "right"; filter?: "text" | "number" | "date" };
type DataRow = Record<string, string | number>;
type RawDataRow = Record<string, string | number>;

function UnderlyingDataModal({
  title,
  data,
  groupedKeys,
  underlyingData,
  format,
  initialFilterOpen,
  onExport,
  onClose,
}: {
  title: string;
  data: any[];
  groupedKeys?: GroupedKey[];
  underlyingData?: UnderlyingData;
  format?: Fmt;
  initialFilterOpen: boolean;
  onExport: () => void;
  onClose: () => void;
}) {
  const { columns, rows, rawRows } = buildUnderlyingRows(data, groupedKeys, format, underlyingData);
  const [filterOpen, setFilterOpen] = useState(initialFilterOpen);
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: columns[0]?.key ?? "name", dir: "asc" });
  const [draftFilters, setDraftFilters] = useState<Record<string, { op: string; value: string }>>(() => emptyFilters(columns));
  const [appliedFilters, setAppliedFilters] = useState<Record<string, { op: string; value: string }>>(() => emptyFilters(columns));

  const filteredRows = rows.filter((row) => matchesFilters(row, appliedFilters));
  const sortedRows = [...filteredRows].sort((a, b) => {
    const av = a[sort.key];
    const bv = b[sort.key];
    const result = typeof av === "number" && typeof bv === "number"
      ? av - bv
      : String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true });
    return sort.dir === "asc" ? result : -result;
  });

  function toggleSort(key: string) {
    setSort((current) => current.key === key
      ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
      : { key, dir: "asc" });
  }

  function updateFilter(key: string, patch: Partial<{ op: string; value: string }>) {
    setDraftFilters((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
  }

  function clearFilters() {
    const next = emptyFilters(columns);
    setDraftFilters(next);
    setAppliedFilters(next);
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#08243d]/45 p-1 md:p-0">
      <div className="flex h-full min-h-0 flex-col rounded bg-white shadow-[0_18px_60px_rgba(8,36,61,0.25)] md:m-0">
        <div className="flex shrink-0 items-center justify-between px-4 py-4 md:px-5 md:py-5">
          <h2 className="min-w-0 truncate text-base font-semibold text-[#092f4f]">{title}</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded text-[#092f4f] hover:bg-[#eef4f9]" title="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 pb-4 md:px-5">
          <div className="flex items-center gap-2">
            <button onClick={() => setFilterOpen((value) => !value)} className={cn("btn-outline h-9 rounded border-[#c8d6e3]", filterOpen && "border-brand-600 text-brand-700 ring-1 ring-brand-500")}>
              <Filter className="h-4 w-4" /> Filter
            </button>
            <span className="text-xs text-ink-500">{sortedRows.length} rows</span>
          </div>
          <button onClick={onExport} className="btn-outline h-8 rounded border-[#c8d6e3]">
              <Download className="h-4 w-4" /> Export
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto border-y border-[#d9e2ec]">
          <table className="min-w-[980px] w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-[#f6f9fc]">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className={cn("border-r border-b border-[#d9e2ec] px-3 py-3 text-left text-xs font-medium text-[#29465f]", column.align === "right" && "text-right")}>
                    <button onClick={() => toggleSort(column.key)} className={cn("inline-flex items-center gap-1", column.align === "right" && "float-right")}>
                      {column.label}
                      <span className="text-[10px] text-ink-400">{sort.key === column.key ? (sort.dir === "asc" ? "^" : "v") : "^"}</span>
                    </button>
                  </th>
                ))}
              </tr>
              {filterOpen && (
                <>
                  <tr>
                    {columns.map((column) => (
                      <th key={column.key} className="border-r border-b border-[#d9e2ec] bg-[#f6f9fc] px-3 py-2">
                        <select
                          value={draftFilters[column.key]?.op ?? defaultFilterOp(column)}
                          onChange={(event) => updateFilter(column.key, { op: event.target.value })}
                          className="h-8 w-full rounded border border-[#c8d6e3] bg-white px-2 text-xs font-semibold text-[#092f4f]"
                        >
                          {filterOps(column).map((op) => <option key={op} value={op}>{op}</option>)}
                        </select>
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {columns.map((column) => (
                      <th key={column.key} className="border-r border-b border-[#d9e2ec] bg-[#f6f9fc] px-3 py-2">
                        <input
                          value={draftFilters[column.key]?.value ?? ""}
                          onChange={(event) => updateFilter(column.key, { value: event.target.value })}
                          className="h-8 w-full rounded border border-[#c8d6e3] bg-white px-2 text-xs font-normal text-[#092f4f] outline-none focus:border-brand-500"
                        />
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th colSpan={columns.length} className="border-b border-[#d9e2ec] bg-[#f6f9fc] px-3 py-2 text-left">
                      <button onClick={() => setAppliedFilters(draftFilters)} className="rounded bg-[#8da1b4] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#71869a]">Apply</button>
                      <button onClick={clearFilters} className="ml-3 text-xs font-semibold text-brand-700 hover:text-brand-800">Clear all</button>
                      <button onClick={() => setFilterOpen(false)} className="float-right rounded border border-[#c8d6e3] bg-white px-2.5 py-1.5 text-xs font-medium text-[#092f4f] hover:bg-[#eef4f9]">Hide</button>
                    </th>
                  </tr>
                </>
              )}
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr key={row.__rowId} className="hover:bg-[#f8fbfd]">
                  {columns.map((column) => (
                    <td key={column.key} className={cn("h-[72px] border-r border-b border-[#d9e2ec] px-3 py-3 text-[#092f4f]", column.align === "right" && "text-right font-medium")}>
                      {row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
              {!sortedRows.length && (
                <tr>
                  <td colSpan={columns.length || 1} className="border-b border-[#d9e2ec] px-3 py-16 text-center text-sm text-ink-400">No data found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function buildUnderlyingRows(data: any[], groupedKeys?: GroupedKey[], format?: Fmt, underlyingData?: UnderlyingData): { columns: DataColumn[]; rows: DataRow[]; rawRows: RawDataRow[] } {
  if (underlyingData) {
    const columns = underlyingData.columns.map((column) => ({ ...column, align: column.align ?? "left" as const }));
    const rawRows: RawDataRow[] = underlyingData.rows.map((row, index) => ({
      __rowId: String(row.id ?? `${row.name ?? row.dealName ?? "row"}-${index}`),
      ...row,
    }));
    return {
      columns,
      rows: rawRows.map((row) => ({
        ...row,
        ...Object.fromEntries(columns.map((column) => {
          const value = row[column.key];
          return [column.key, column.filter === "number" && typeof value === "number" ? value.toLocaleString("en-IN") : String(value ?? "")];
        })),
      })),
      rawRows,
    };
  }

  if (groupedKeys?.length) {
    const columns: DataColumn[] = [
      { key: "name", label: firstColumnLabel(groupedKeys), align: "left" },
      ...groupedKeys.map((key) => ({ key: key.key, label: key.label, align: "right" as const })),
    ];
    const rawRows: RawDataRow[] = data.map((row, index) => ({
      __rowId: `${row.name}-${index}`,
      name: row.name,
      ...Object.fromEntries(groupedKeys.map((key) => [key.key, Number(row[key.key] ?? 0)])),
    }));
    const rows = rawRows.map((row) => ({
      ...row,
      ...Object.fromEntries(groupedKeys.map((key) => [key.key, fmtVal(Number(row[key.key] ?? 0), format)])),
    }));
    return { columns, rows, rawRows };
  }

  const rawRows: RawDataRow[] = data.map((row, index) => ({
    __rowId: `${row.name}-${index}`,
    name: row.name,
    value: Number(row.value ?? 0),
  }));
  return {
    columns: [
      { key: "name", label: inferSingleNameLabel(data), align: "left" },
      { key: "value", label: inferValueLabel(format), align: "right" },
    ],
    rows: rawRows.map((row) => ({ ...row, value: fmtVal(Number(row.value ?? 0), format) })),
    rawRows,
  };
}

function firstColumnLabel(groupedKeys: GroupedKey[]) {
  return groupedKeys.some((key) => key.label.toLowerCase().includes("contact")) ? "Sales owner" : "Name";
}

function inferSingleNameLabel(data: any[]) {
  const first = String(data[0]?.name ?? "").toLowerCase();
  if (first.includes("won") || first.includes("lost") || first.includes("new") || first.includes("qualification")) return "Deal Stage";
  return "Name";
}

function inferValueLabel(format?: Fmt) {
  if (format === "currency" || format === "lakh") return "Deal value";
  if (format === "percent") return "Percentage";
  return "Total";
}

function emptyFilters(columns: DataColumn[]) {
  return Object.fromEntries(columns.map((column) => [column.key, { op: defaultFilterOp(column), value: "" }]));
}

function defaultFilterOp(column: DataColumn) {
  return column.align === "right" ? "equal" : "is";
}

function filterOps(column: DataColumn) {
  return column.align === "right" ? ["equal", "greater", "less"] : ["is", "contains"];
}

function matchesFilters(row: DataRow, filters: Record<string, { op: string; value: string }>) {
  return Object.entries(filters).every(([key, filter]) => {
    const needle = filter.value.trim().toLowerCase();
    if (!needle) return true;
    const raw = row[key];
    const text = String(raw ?? "").toLowerCase();
    if (filter.op === "contains") return text.includes(needle);
    if (filter.op === "is") return text.includes(needle);
    const number = Number(String(raw ?? "").replace(/[^\d.-]/g, ""));
    const target = Number(needle.replace(/[^\d.-]/g, ""));
    if (Number.isNaN(number) || Number.isNaN(target)) return text.includes(needle);
    if (filter.op === "greater") return number > target;
    if (filter.op === "less") return number < target;
    return number === target;
  });
}

function summaryCells(columns: DataColumn[], rawRows: RawDataRow[]) {
  return columns.map((column, index) => {
    if (index === 0) return { key: column.key, value: "Grand Total", align: column.align };
    if (column.align !== "right") return { key: column.key, value: "", align: column.align };
    const total = rawRows.reduce((sum, row) => sum + Number(row[column.key] ?? 0), 0);
    return { key: column.key, value: total.toLocaleString("en-IN"), align: column.align };
  });
}

function Heatmap({ data, format }: { data: any[]; format?: Fmt }) {
  if (!data.length) return <div className="grid h-full place-items-center text-sm text-ink-400">No data</div>;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex flex-wrap gap-2 content-start py-2">
      {data.map((d, i) => {
        const intensity = 0.15 + (d.value / max) * 0.85;
        return (
          <div key={i} className="rounded-lg p-3 min-w-24 text-white" style={{ background: `rgba(52,99,255,${intensity})` }}>
            <p className="text-[11px] opacity-90 truncate">{d.name}</p>
            <p className="text-lg font-bold">{fmtVal(d.value, format)}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- toolbar bits ---------- */

function IconBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick?: () => void }) {
  return (
    <button title={title} onClick={onClick} className="grid place-items-center h-7 w-7 rounded-md text-ink-400 hover:bg-ink-100 hover:text-ink-700">
      {children}
    </button>
  );
}

function ResizeHandle({ size, onResize }: { size: { cols: number; rows: number }; onResize: (size: { cols: number; rows: number }) => void }) {
  const startRef = useRef<{ x: number; y: number; cols: number; rows: number } | null>(null);

  function resizeBy(delta: number) {
    onResize({
      cols: clamp(size.cols + delta, 1, 4),
      rows: clamp(size.rows + delta, 1, 3),
    });
  }

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY, cols: size.cols, rows: size.rows };
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const start = startRef.current;
    if (!start) return;
    const cols = clamp(start.cols + Math.round((e.clientX - start.x) / 96), 1, 4);
    const rows = clamp(start.rows + Math.round((e.clientY - start.y) / 92), 1, 3);
    if (cols !== size.cols || rows !== size.rows) onResize({ cols, rows });
  }

  function onPointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    startRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  return (
    <div className="absolute bottom-2 right-2 hidden items-center gap-1 rounded-lg border border-ink-200 bg-white/95 p-1 text-ink-400 shadow-sm transition md:flex md:opacity-0 md:group-hover/widget:opacity-100">
      <button
        type="button"
        title="Make widget smaller"
        onClick={() => resizeBy(-1)}
        disabled={size.cols === 1 && size.rows === 1}
        className="grid h-7 w-7 place-items-center rounded-md hover:bg-ink-100 hover:text-ink-700 disabled:pointer-events-none disabled:opacity-40"
      >
        <Minimize2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Make widget larger"
        onClick={() => resizeBy(1)}
        disabled={size.cols === 4 && size.rows === 3}
        className="grid h-7 w-7 place-items-center rounded-md hover:bg-ink-100 hover:text-brand-600 disabled:pointer-events-none disabled:opacity-40"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Drag to resize widget"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="grid h-7 w-7 touch-none place-items-center rounded-md cursor-nwse-resize hover:bg-ink-100 hover:text-brand-600"
      >
        <MoveDiagonal2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function TypeMenu({ current, allowed, onChoose }: { current: ChartType; allowed: ChartType[]; onChoose: (t: ChartType) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  const Cur = META[current].icon;
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} title="Change chart type" className="flex items-center gap-0.5 h-7 px-1.5 rounded-md text-ink-400 hover:bg-ink-100 hover:text-ink-700">
        <Cur className="h-4 w-4" /><ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 w-52 card shadow-pop z-30 py-1">
          {allowed.map((t) => {
            const Icon = META[t].icon;
            return (
              <button key={t} onClick={() => { onChoose(t); setOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-brand-50", current === t ? "text-brand-700 bg-brand-50/60" : "text-ink-700")}>
                <Icon className="h-4 w-4 text-ink-400" /> {META[t].label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MoreMenu({
  onFilters,
  onEmailGraph,
  onEmailTabular,
  onDownloadGraph,
  onDownloadTabular,
  onDownloadPdf,
}: {
  onFilters: () => void;
  onEmailGraph: () => void;
  onEmailTabular: () => void;
  onDownloadGraph: () => void;
  onDownloadTabular: () => void;
  onDownloadPdf: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [submenu, setSubmenu] = useState<null | "email" | "download">(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <IconBtn title="More" onClick={() => setOpen((o) => !o)}><MoreVertical className="h-4 w-4" /></IconBtn>
      {open && (
        <div className="absolute right-0 top-8 w-48 rounded-lg border border-[#d9e2ec] bg-white py-1 text-[#17324d] shadow-[0_12px_28px_rgba(31,50,70,0.18)] z-30">
          <button onClick={() => { onFilters(); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"><Filter className="h-4 w-4 text-ink-400" /> Filters applied</button>
          <div className="relative" onMouseEnter={() => setSubmenu("email")}>
            <button onClick={() => setSubmenu(submenu === "email" ? null : "email")} className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50", submenu === "email" && "bg-[#eef4f9]")}>
              <Mail className="h-4 w-4 text-ink-400" />
              <span className="flex-1 text-left">Export to email</span>
              <ChevronRight className="h-4 w-4 text-ink-400" />
            </button>
            {submenu === "email" && (
              <div className="absolute left-full top-0 ml-1 w-44 rounded-lg border border-[#d9e2ec] bg-white py-1 shadow-[0_12px_28px_rgba(31,50,70,0.18)]">
                <button onClick={() => { onEmailGraph(); setOpen(false); }} className="w-full px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50">CSV of graph data</button>
                <button onClick={() => { onEmailTabular(); setOpen(false); }} className="w-full px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50">CSV of tabular data</button>
              </div>
            )}
          </div>
          <div className="relative" onMouseEnter={() => setSubmenu("download")}>
            <button onClick={() => setSubmenu(submenu === "download" ? null : "download")} className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50", submenu === "download" && "bg-[#eef4f9]")}>
              <Download className="h-4 w-4 text-ink-400" />
              <span className="flex-1 text-left">Download</span>
              <ChevronRight className="h-4 w-4 text-ink-400" />
            </button>
            {submenu === "download" && (
              <div className="absolute left-full top-0 ml-1 w-44 rounded-lg border border-[#d9e2ec] bg-white py-1 shadow-[0_12px_28px_rgba(31,50,70,0.18)]">
                <button onClick={() => { onDownloadGraph(); setOpen(false); }} className="w-full px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50">CSV of graph data</button>
                <button onClick={() => { onDownloadTabular(); setOpen(false); }} className="w-full px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50">CSV of tabular data</button>
                <button onClick={() => { onDownloadPdf(); setOpen(false); }} className="w-full px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50">PDF of graph data</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ExpandModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-ink-900/40" onClick={onClose} />
      <div className="relative w-full max-w-4xl card shadow-pop">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
          <h2 className="text-base font-semibold text-ink-900">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-auto">{children}</div>
      </div>
    </div>
  );
}
