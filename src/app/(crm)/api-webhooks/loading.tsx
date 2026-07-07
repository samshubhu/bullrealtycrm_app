import { PageHeaderSkeleton, ListSkeleton } from "@/components/ui/skeletons";

export default function ApiWebhooksLoading() {
  return (
    <div>
      <PageHeaderSkeleton actions />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ListSkeleton rows={4} avatar={false} />
        <ListSkeleton rows={4} avatar={false} />
      </div>
    </div>
  );
}
