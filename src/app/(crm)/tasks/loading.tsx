import { PageHeaderSkeleton, SkeletonBlock } from "@/components/ui/skeletons";

export default function TasksLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="mb-4 flex gap-2 border-b border-ink-100 pb-2">
        {["Today", "Upcoming", "Overdue", "Completed", "All"].map((t) => (
          <SkeletonBlock key={t} className="h-7 w-20 rounded-md" />
        ))}
      </div>
      <div className="card divide-y divide-ink-100 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <SkeletonBlock className="h-5 w-5 rounded" />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBlock className="h-3.5 w-1/3" />
              <SkeletonBlock className="h-3 w-1/4" />
            </div>
            <SkeletonBlock className="h-5 w-16 rounded-full" />
            <SkeletonBlock className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
