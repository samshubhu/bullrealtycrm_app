import { PageHeaderSkeleton, SkeletonBlock } from "@/components/ui/skeletons";

export default function SettingsLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="flex gap-2">
        <div className="card h-fit w-56 shrink-0 space-y-1.5 p-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
        <div className="card flex-1 overflow-hidden">
          <div className="border-b border-ink-100 px-4 py-3"><SkeletonBlock className="h-4 w-32" /></div>
          <div className="flex flex-wrap gap-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-7 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
