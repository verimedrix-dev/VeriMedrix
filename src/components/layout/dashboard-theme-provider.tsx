"use client";

import { ThemeProvider } from "@/components/theme-provider";

export function DashboardThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="dashboard-theme"
    >
      {children}
    </ThemeProvider>
  );
}
