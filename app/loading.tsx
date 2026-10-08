import { PageSkeleton } from "@/components/common/page-skeleton";

export default function Loading() {
  return (
    <div className="w-full px-6 py-10 md:px-10">
      <PageSkeleton />
    </div>
  );
}
