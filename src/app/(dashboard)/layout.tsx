import { Suspense } from "react";
import { redirect } from "next/navigation";
import { VeyroLogoFull } from "@/components/ui/veyro-logo";
import { Separator } from "@/components/ui/separator";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardThemeProvider } from "@/components/layout/dashboard-theme-provider";
import { InactivityHandler } from "@/components/auth/inactivity-handler";
import DashboardLoading from "./loading";
import { getCurrentUser, ensureUserAndPractice } from "@/lib/actions/practice";
import { getAccessLevelDisplayName } from "@/lib/permissions";
import { getUnreadAlertCount } from "@/lib/actions/alerts";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the database user with role - this will create user/practice if needed
  const { user: dbUser, practice } = await ensureUserAndPractice();

  if (!dbUser) {
    redirect("/sign-in");
  }

  // Check if onboarding is completed - redirect to onboarding if not
  if (practice && !practice.onboardingCompleted && dbUser.role === "PRACTICE_OWNER") {
    redirect("/onboarding");
  }

  // Get unread notification count for the current user
  const unreadNotifications = await getUnreadAlertCount(dbUser.id);

  return (
    <DashboardThemeProvider>
      <InactivityHandler />
      <div className="min-h-screen bg-background">
        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r shadow-sm">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="px-6 py-4 border-b">
              <VeyroLogoFull />
            </div>

            {/* Navigation - Client Component with role-based filtering */}
            <SidebarNav userRole={dbUser.role} subscriptionTier={practice?.subscriptionTier} unreadNotifications={unreadNotifications} />

            <Separator />

            {/* Theme Toggle */}
            <div className="px-4 py-2">
              <ThemeToggle />
            </div>

            <Separator />

            {/* User Section */}
            <div className="p-4">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="text-blue-700 dark:text-blue-300 font-medium text-sm">
                    {dbUser.name?.charAt(0).toUpperCase() || dbUser.email?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {dbUser.name || dbUser.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {getAccessLevelDisplayName(dbUser.role)}
                  </p>
                </div>
              </div>
              <SignOutButton />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="pl-64">
          <div className="p-8">
            <Suspense fallback={<DashboardLoading />}>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
    </DashboardThemeProvider>
  );
}
