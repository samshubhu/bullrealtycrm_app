import { PageHeaderSkeleton, StatCardsSkeleton, ListSkeleton, SkeletonBlock } from "@/components/ui/skeletons";

export default function EmailLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={4} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ListSkeleton rows={6} avatar={false} className="lg:col-span-2" />
        <div className="card h-fit overflow-hidden">
          <div className="border-b border-ink-100 px-4 py-3"><SkeletonBlock className="h-4 w-24" /></div>
          <div className="divide-y divide-ink-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2 px-4 py-3">
                <SkeletonBlock className="h-3.5 w-1/2" />
                <SkeletonBlock className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
