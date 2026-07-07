import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeletons";

export default function TeamLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <TableSkeleton columns={5} rows={7} />
    </div>
  );
}
