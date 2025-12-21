"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const isConnectionError =
    error.message?.includes("Can't reach database server") ||
    error.message?.includes("Connection refused") ||
    error.message?.includes("PrismaClient");

  useEffect(() => {
    // Auto-refresh on connection errors after a short delay
    if (isConnectionError) {
      const timer = setTimeout(() => {
        window.location.reload();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isConnectionError]);

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>

        {isConnectionError ? (
          <>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Reconnecting...
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Lost connection to the server. Refreshing automatically...
            </p>
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Please wait</span>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {error.message || "An unexpected error occurred"}
            </p>
            <Button onClick={reset} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try again
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
