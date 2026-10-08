import { PageContainer } from "@/components/common/page-container";
import { PageSkeleton } from "@/components/common/page-skeleton";

export default function Loading() {
  return (
    <PageContainer>
      <PageSkeleton />
    </PageContainer>
  );
}
