import { PageHeaderSkeleton, ListSkeleton } from "@/components/ui/skeletons";

export default function NotificationsLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <ListSkeleton rows={8} />
    </div>
  );
}
