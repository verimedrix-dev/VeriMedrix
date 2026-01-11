"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          backgroundColor: "#f8fafc",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}>
          <div style={{
            maxWidth: "400px",
            width: "100%",
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "2rem",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            textAlign: "center"
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem"
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1e293b", marginBottom: "0.5rem" }}>
              Something went wrong
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
              We encountered an unexpected error. Please try again.
            </p>
            {error.digest && (
              <p style={{ color: "#94a3b8", fontSize: "0.75rem", marginBottom: "1rem" }}>
                Error reference: {error.digest}
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <button
                onClick={reset}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  backgroundColor: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: "pointer"
                }}
              >
                Try Again
              </button>
              <a
                href="/dashboard"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  backgroundColor: "transparent",
                  color: "#475569",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  textDecoration: "none",
                  display: "block",
                  boxSizing: "border-box"
                }}
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
