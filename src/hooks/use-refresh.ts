"use client";

import { useRouter } from "next/navigation";
import { useTransition, useCallback } from "react";

/**
 * Custom hook for refreshing the page with proper transition handling.
 * This ensures the UI updates immediately after data mutations.
 */
export function useRefresh() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router, startTransition]);

  return { refresh, isPending };
}
