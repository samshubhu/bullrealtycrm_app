import { PageHeaderSkeleton, SkeletonBlock } from "@/components/ui/skeletons";

const COLUMNS = 5;

export default function PipelineLoading() {
  return (
    <div className="flex h-full flex-col">
      <PageHeaderSkeleton />
      <div className="flex gap-3 overflow-x-auto pb-4">
        {Array.from({ length: COLUMNS }).map((_, col) => (
          <div key={col} className="w-72 shrink-0">
            <div className="mb-2 flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2">
              <SkeletonBlock className="h-3.5 w-24" />
              <SkeletonBlock className="h-4 w-8 rounded-full" />
            </div>
            <div className="space-y-2.5">
              {Array.from({ length: 3 - (col % 2) }).map((_, i) => (
                <div key={i} className="card space-y-2.5 p-3">
                  <SkeletonBlock className="h-3.5 w-3/4" />
                  <SkeletonBlock className="h-3 w-1/2" />
                  <div className="flex items-center justify-between pt-1">
                    <SkeletonBlock className="h-4 w-16" />
                    <SkeletonBlock className="h-6 w-6 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
