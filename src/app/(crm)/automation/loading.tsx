import { PageHeaderSkeleton, SkeletonBlock } from "@/components/ui/skeletons";

export default function AutomationLoading() {
  return (
    <div>
      <PageHeaderSkeleton actions />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <SkeletonBlock className="h-10 w-10 rounded-lg" />
                <div className="space-y-2.5">
                  <SkeletonBlock className="h-4 w-40" />
                  <div className="flex items-center gap-2">
                    <SkeletonBlock className="h-6 w-28 rounded-full" />
                    <SkeletonBlock className="h-6 w-24 rounded-full" />
                  </div>
                </div>
              </div>
              <SkeletonBlock className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
