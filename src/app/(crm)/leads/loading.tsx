import { Download, Filter, Plus, Search, SlidersHorizontal, Table2 } from "lucide-react";

const columns = ["Name", "Mobile", "Email", "Status", "Priority", "Project", "Owner", "Score"];
const tabs = ["All leads", "My leads", "New", "Cold", "Warm", "Hot", "Interested", "Site visit"];

export default function LeadsLoading() {
  return (
    <div>
      <div className="mb-5">
        <div className="skeleton h-8 w-24 rounded" />
        <div className="skeleton mt-2 h-4 w-44 rounded" />
      </div>

      <div className="overflow-hidden rounded-lg border border-[#d9e2ec] bg-white shadow-none">
        <div className="h-0.5 overflow-hidden bg-[#e8eff6]">
          <div className="h-full w-1/3 animate-[loading-bar_1.2s_ease-in-out_infinite] bg-brand-500" />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-[#d9e2ec] bg-white px-3 py-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8aa0b4]" />
            <div className="skeleton h-9 rounded border border-[#c8d6e3] bg-[#f8fafc] pl-9" />
          </div>
          <button className="btn-outline h-9 rounded border-[#c8d6e3] text-[#8aa0b4]"><Download className="h-4 w-4" /> Export</button>
          <button className="btn-primary h-9 rounded opacity-70"><Plus className="h-4 w-4" /> New Lead</button>
        </div>

        <div className="flex items-center overflow-hidden border-b border-[#d9e2ec] bg-white px-3">
          {tabs.map((tab, index) => (
            <div key={tab} className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium ${index === 0 ? "border-x border-[#d9e2ec] bg-[#eef4f9] text-brand-700" : "text-[#8aa0b4]"}`}>
              <span>{tab}</span>
              <span className="skeleton h-5 w-7 rounded-full" />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-b border-[#d9e2ec] bg-[#eef3f8] px-3 py-2.5">
          <div className="flex flex-wrap gap-2">
            <button className="btn-outline h-8 rounded border-[#c8d6e3] text-[#29465f]"><Table2 className="h-4 w-4" /> Table</button>
            <button className="btn-ghost h-8 rounded text-[#29465f]"><Filter className="h-4 w-4" /> Filter by</button>
            <div className="skeleton h-8 w-28 rounded" />
            <div className="skeleton h-8 w-32 rounded" />
          </div>
          <button className="btn-ghost h-8 rounded text-[#29465f]"><SlidersHorizontal className="h-4 w-4" /> Customize table</button>
        </div>

        <div className="overflow-hidden">
          <table className="w-full table-fixed border-collapse text-sm">
            <thead>
              <tr className="bg-[#f8fafc] text-left text-xs font-semibold text-[#29465f]">
                <th className="w-10 border-r border-b border-[#d9e2ec] px-3 py-3">
                  <div className="h-4 w-4 rounded border border-[#c8d6e3] bg-white" />
                </th>
                {columns.map((column) => (
                  <th key={column} className="border-r border-b border-[#d9e2ec] px-4 py-3">
                    <span>{column}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }).map((_, row) => (
                <LeadSkeletonRow key={row} row={row} />
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-[#d9e2ec] bg-white px-4 py-3 text-xs text-[#5f7285]">
            <span className="skeleton h-4 w-28 rounded" />
            <span className="skeleton h-4 w-36 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadSkeletonRow({ row }: { row: number }) {
  return (
    <tr className={row % 2 ? "bg-white" : "bg-[#fbfdff]"}>
      <td className="border-r border-b border-[#d9e2ec] px-3 py-3">
        <div className="h-4 w-4 rounded border border-[#c8d6e3] bg-white" />
      </td>
      <td className="border-r border-b border-[#d9e2ec] px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="skeleton h-8 w-8 rounded-full" />
          <div className="min-w-0 space-y-1.5">
            <div className="skeleton h-3.5 w-32 rounded" />
            <div className="skeleton h-3 w-20 rounded" />
          </div>
        </div>
      </td>
      <SkeletonCell width="w-28" />
      <SkeletonCell width="w-40" />
      <td className="border-r border-b border-[#d9e2ec] px-4 py-3">
        <div className="skeleton h-6 w-24 rounded bg-sky-100" />
      </td>
      <td className="border-r border-b border-[#d9e2ec] px-4 py-3">
        <div className={`skeleton h-6 w-16 rounded ${row % 3 === 0 ? "bg-red-100" : row % 3 === 1 ? "bg-amber-100" : "bg-sky-100"}`} />
      </td>
      <SkeletonCell width="w-32" />
      <td className="border-r border-b border-[#d9e2ec] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="skeleton h-6 w-6 rounded-full" />
          <div className="skeleton h-3.5 w-24 rounded" />
        </div>
      </td>
      <td className="border-r border-b border-[#d9e2ec] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-[#e8eff6]">
            <div className="skeleton h-full w-2/3 rounded-full bg-brand-100" />
          </div>
          <div className="skeleton h-3 w-6 rounded" />
        </div>
      </td>
    </tr>
  );
}

function SkeletonCell({ width }: { width: string }) {
  return (
    <td className="border-r border-b border-[#d9e2ec] px-4 py-3">
      <div className={`skeleton h-3.5 ${width} rounded`} />
    </td>
  );
}
