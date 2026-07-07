import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeletons";

export default function ContactsLoading() {
  return (
    <div>
      <PageHeaderSkeleton actions />
      <TableSkeleton columns={7} rows={9} />
    </div>
  );
}
