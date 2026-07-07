import { PageHeaderSkeleton, StatCardsSkeleton, TableSkeleton } from "@/components/ui/skeletons";

export default function DealsLoading() {
  return (
    <div>
      <PageHeaderSkeleton actions />
      <StatCardsSkeleton count={4} />
      <TableSkeleton columns={7} rows={8} />
    </div>
  );
}
