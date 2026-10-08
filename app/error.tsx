"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/common/error-state";

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
    <div className="w-full px-6 py-10 md:px-10">
      <ErrorState digest={error.digest} onRetry={unstable_retry} />
    </div>
  );
}
