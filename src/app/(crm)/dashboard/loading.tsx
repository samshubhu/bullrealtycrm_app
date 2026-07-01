import { Download, HelpCircle, Pencil, Plus, Star } from "lucide-react";

const chartCards = [
  { type: "kpi", className: "h-36" },
  { type: "kpi-red", className: "h-36" },
  { type: "funnel", className: "h-72 md:col-span-2" },
  { type: "bar", className: "h-72 md:col-span-2" },
  { type: "stacked", className: "h-72 md:col-span-2" },
  { type: "donut", className: "h-72 md:col-span-2" },
];

export default function DashboardLoading() {
  return (
    <div className="-m-5 flex h-[calc(100vh-3.5rem)] min-h-0 flex-col overflow-hidden bg-white">
      <div className="h-0.5 shrink-0 overflow-hidden bg-[#e8eff6]">
        <div className="h-full w-1/3 animate-[loading-bar_1.2s_ease-in-out_infinite] bg-brand-500" />
      </div>

      <div className="shrink-0 border-b border-[#d9e2ec] bg-white px-5 py-3">
        <div className="skeleton h-7 w-36 rounded" />
      </div>

      <div className="flex shrink-0 items-stretch border-b border-[#cfdbe7] bg-[#f4f7fa] px-5">
        {["w-52", "w-40", "w-44"].map((width, index) => (
          <div key={width} className={`border-x border-[#d9e2ec] px-4 py-3 ${index === 0 ? "bg-white" : "bg-[#f4f7fa]"}`}>
            <div className={`skeleton h-4 ${width} rounded`} />
          </div>
        ))}
        <div className="grid h-11 w-10 place-items-center">
          <Plus className="h-4 w-4 text-[#8aa0b4]" />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 border-b border-[#d9e2ec] bg-white px-5 py-2.5">
        <div className="skeleton h-5 w-56 rounded" />
        <div className="skeleton h-7 w-16 rounded border border-brand-100 bg-brand-50" />
        <Star className="h-4 w-4 text-[#b8c6d4]" />
        <div className="flex-1" />
        <div className="hidden h-4 w-56 rounded bg-[#eef4f9] md:block" />
        <HelpCircle className="h-4 w-4 text-[#8aa0b4]" />
        <button className="btn-outline h-8 rounded border-[#c8d6e3] text-[#8aa0b4]"><Download className="h-4 w-4" /> Export</button>
        <button className="btn-primary h-8 rounded opacity-70"><Pencil className="h-4 w-4" /> Edit</button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden bg-[#f4f7fa] px-3 py-3 md:px-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {chartCards.map((card, index) => (
            <DashboardSkeletonCard key={`${card.type}-${index}`} type={card.type} className={card.className} />
          ))}
        </div>
      </div>

      <div className="flex shrink-0 border-t border-[#d9e2ec] bg-white px-5">
        {["Summary", "Deals", "Contacts", "Sales activities", "Revenue breakdown"].map((item, index) => (
          <div key={item} className={`px-4 py-3 ${index === 0 ? "border-x border-[#d9e2ec] text-brand-700" : "text-[#8aa0b4]"}`}>
            <span className="text-sm font-medium">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardSkeletonCard({ type, className }: { type: string; className?: string }) {
  return (
    <div className={`rounded-lg border border-[#d9e2ec] bg-white p-4 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="skeleton h-4 w-36 rounded" />
        <div className="flex gap-1 opacity-70">
          <div className="skeleton h-6 w-6 rounded" />
          <div className="skeleton h-6 w-6 rounded" />
        </div>
      </div>
      {type.startsWith("kpi") && <KpiSkeleton tone={type === "kpi-red" ? "red" : "green"} />}
      {type === "funnel" && <FunnelSkeleton />}
      {type === "bar" && <BarSkeleton />}
      {type === "stacked" && <StackedSkeleton />}
      {type === "donut" && <DonutSkeleton />}
    </div>
  );
}

function KpiSkeleton({ tone }: { tone: "green" | "red" }) {
  return (
    <div className="flex h-[calc(100%-2rem)] items-center">
      <div>
        <div className={`skeleton mb-3 h-8 w-28 rounded ${tone === "red" ? "bg-red-100" : "bg-emerald-100"}`} />
        <div className="skeleton h-3 w-40 rounded" />
      </div>
    </div>
  );
}

function FunnelSkeleton() {
  return (
    <div className="flex h-[220px] items-center justify-center gap-8">
      <div className="w-56 space-y-0">
        <div className="skeleton mx-auto h-14 w-56 [clip-path:polygon(0_0,100%_0,82%_100%,18%_100%)] bg-brand-100" />
        <div className="skeleton mx-auto h-12 w-40 [clip-path:polygon(10%_0,90%_0,74%_100%,26%_100%)] bg-pink-100" />
        <div className="skeleton mx-auto h-10 w-28 [clip-path:polygon(12%_0,88%_0,72%_100%,28%_100%)] bg-violet-100" />
        <div className="skeleton mx-auto h-9 w-16 bg-amber-100" />
      </div>
      <div className="hidden w-48 space-y-3 md:block">
        <div className="skeleton h-3 w-44 rounded" />
        <div className="skeleton h-3 w-36 rounded" />
        <div className="skeleton h-3 w-40 rounded" />
      </div>
    </div>
  );
}

function BarSkeleton() {
  return (
    <div className="flex h-[220px] items-end gap-8 px-8 pb-8">
      {[96, 142, 70].map((height, index) => (
        <div key={height} className="flex flex-1 flex-col items-center gap-3">
          <div className={`skeleton w-full max-w-24 rounded-t ${index === 1 ? "bg-brand-100" : "bg-sky-100"}`} style={{ height }} />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
      ))}
    </div>
  );
}

function StackedSkeleton() {
  return (
    <div className="flex h-[220px] items-end justify-center gap-10 pb-8">
      {[120, 76, 158].map((height) => (
        <div key={height} className="flex w-12 flex-col justify-end overflow-hidden rounded-t" style={{ height }}>
          <div className="skeleton h-1/3 bg-emerald-100" />
          <div className="skeleton h-1/4 bg-brand-100" />
          <div className="skeleton h-1/5 bg-pink-100" />
          <div className="skeleton flex-1 bg-amber-100" />
        </div>
      ))}
    </div>
  );
}

function DonutSkeleton() {
  return (
    <div className="flex h-[220px] items-center justify-center gap-10">
      <div className="skeleton grid h-40 w-40 place-items-center rounded-full bg-brand-100">
        <div className="h-20 w-20 rounded-full bg-white" />
      </div>
      <div className="hidden w-44 space-y-3 md:block">
        <div className="skeleton h-3 w-40 rounded" />
        <div className="skeleton h-3 w-32 rounded" />
        <div className="skeleton h-3 w-36 rounded" />
      </div>
    </div>
  );
}
