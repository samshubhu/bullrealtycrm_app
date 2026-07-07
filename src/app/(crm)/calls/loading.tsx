import { PageHeaderSkeleton, StatCardsSkeleton, TableSkeleton } from "@/components/ui/skeletons";

export default function CallsLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={4} />
      <TableSkeleton columns={7} rows={9} />
    </div>
  );
}
