import { PageHeaderSkeleton, SkeletonBlock } from "@/components/ui/skeletons";

export default function ProfileLoading() {
  return (
    <div className="max-w-2xl">
      <PageHeaderSkeleton />
      <div className="card mb-4 p-6">
        <div className="flex items-center gap-4">
          <SkeletonBlock className="h-16 w-16 rounded-full" />
          <div className="space-y-2.5">
            <SkeletonBlock className="h-5 w-40" />
            <SkeletonBlock className="h-4 w-52" />
            <SkeletonBlock className="h-6 w-24 rounded-full" />
          </div>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="border-b border-ink-100 px-4 py-3"><SkeletonBlock className="h-4 w-24" /></div>
        <div className="grid grid-cols-2 gap-4 p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>
        <div className="flex justify-end border-t border-ink-100 px-5 py-3">
          <SkeletonBlock className="h-9 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
