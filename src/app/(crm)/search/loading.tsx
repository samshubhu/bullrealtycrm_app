import { PageHeaderSkeleton, ListSkeleton } from "@/components/ui/skeletons";

export default function SearchLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ListSkeleton rows={4} />
        <ListSkeleton rows={4} />
      </div>
    </div>
  );
}
