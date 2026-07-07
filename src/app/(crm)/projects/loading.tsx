import { PageHeaderSkeleton, CardGridSkeleton } from "@/components/ui/skeletons";

export default function ProjectsLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <CardGridSkeleton count={6} />
    </div>
  );
}
