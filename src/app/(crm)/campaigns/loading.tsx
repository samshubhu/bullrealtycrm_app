import { PageHeaderSkeleton, StatCardsSkeleton, TableSkeleton } from "@/components/ui/skeletons";

export default function CampaignsLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={4} />
      <TableSkeleton columns={6} rows={8} />
    </div>
  );
}
