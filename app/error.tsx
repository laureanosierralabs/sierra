"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/common/error-state";
import { PageContainer } from "@/components/common/page-container";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageContainer>
      <ErrorState digest={error.digest} onRetry={unstable_retry} />
    </PageContainer>
  );
}
