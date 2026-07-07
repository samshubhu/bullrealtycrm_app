import { PageHeaderSkeleton, SkeletonBlock } from "@/components/ui/skeletons";

export default function CalendarLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-ink-100">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="px-3 py-2.5 text-center text-xs font-medium text-ink-500">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="min-h-[104px] space-y-1.5 border-b border-r border-ink-100 p-1.5">
              <SkeletonBlock className="h-6 w-6 rounded-full" />
              {i % 3 === 0 && <SkeletonBlock className="h-4 w-full rounded" />}
              {i % 4 === 0 && <SkeletonBlock className="h-4 w-4/5 rounded" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
