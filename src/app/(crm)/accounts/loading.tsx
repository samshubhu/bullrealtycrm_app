import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeletons";

export default function AccountsLoading() {
  return (
    <div>
      <PageHeaderSkeleton actions />
      <TableSkeleton columns={6} rows={9} />
    </div>
  );
}
