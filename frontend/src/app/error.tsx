"use client";

import { useEffect } from "react";
import ErrorState from "@/components/ErrorState";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <ErrorState 
        message="A critical error occurred while rendering this page. Our team has been notified."
        onRetry={() => reset()}
        fullHeight={true}
      />
    </div>
  );
}
