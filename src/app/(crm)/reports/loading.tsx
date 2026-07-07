import { PageHeaderSkeleton, StatCardsSkeleton, ChartCardSkeleton } from "@/components/ui/skeletons";

export default function ReportsLoading() {
  return (
    <div>
      <PageHeaderSkeleton actions />
      <StatCardsSkeleton count={4} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <ChartCardSkeleton key={i} />
        ))}
        <ChartCardSkeleton className="lg:col-span-2" />
      </div>
    </div>
  );
}
