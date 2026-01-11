import { Suspense } from "react";
import { redirect } from "next/navigation";
import { VeyroLogoFull } from "@/components/ui/veyro-logo";
import { Separator } from "@/components/ui/separator";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { PracticeSwitcher } from "@/components/layout/practice-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardThemeProvider } from "@/components/layout/dashboard-theme-provider";
import { InactivityHandler } from "@/components/auth/inactivity-handler";
import DashboardLoading from "./loading";
import { ensureUserAndPractice, getUserPractices } from "@/lib/actions/practice";
import { getAccessLevelDisplayName } from "@/lib/permissions";
import { getUnreadAlertCount } from "@/lib/actions/alerts";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the database user with role - this will create user/practice if needed
  let result;
  try {
    result = await ensureUserAndPractice();
  } catch (error) {
    // Re-throw redirect errors so Next.js can handle them properly
    // Next.js redirect() throws an error with digest starting with "NEXT_REDIRECT"
    if (
      error instanceof Error &&
      "digest" in error &&
      typeof (error as Error & { digest?: string }).digest === "string" &&
      (error as Error & { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    // Log the actual error for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to load user data:", errorMessage);

    // Check if this is a database connection error vs auth error
    const isDbError = errorMessage.includes("database") ||
                      errorMessage.includes("prisma") ||
                      errorMessage.includes("connection") ||
                      errorMessage.includes("ECONNREFUSED");

    if (isDbError) {
      // Database error - don't sign out the user, just show error
      console.error("Database connection error - user session may still be valid");
    }

    redirect("/sign-in?error=session");
  }

  if (!result.user) {
    redirect("/sign-in");
  }

  // Check if user needs to select a practice (has multiple, none selected)
  if ("needsPracticeSelection" in result && result.needsPracticeSelection) {
    redirect("/select-practice");
  }

  const { user: dbUser, practice } = result;
  const userRole = "role" in result && result.role ? result.role : dbUser.role;
  const isOwner = "isOwner" in result ? result.isOwner : dbUser.role === "PRACTICE_OWNER";

  // Check if onboarding is completed - redirect to onboarding if not
  if (practice && !practice.onboardingCompleted && isOwner) {
    redirect("/onboarding");
  }

  // Get unread notification count - with fallback to 0 on error
  let unreadNotifications = 0;
  try {
    unreadNotifications = await getUnreadAlertCount(dbUser.id);
  } catch (error) {
    console.error("Failed to load notification count:", error);
  }

  // Get all practices for the switcher - with fallback to empty array
  let userPractices: Awaited<ReturnType<typeof getUserPractices>> = [];
  try {
    userPractices = await getUserPractices();
  } catch (error) {
    console.error("Failed to load user practices:", error);
  }

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

            {/* Practice Switcher - only shown for multi-practice users */}
            <PracticeSwitcher
              practices={userPractices}
              currentPracticeName={practice?.name || "My Practice"}
            />

            {/* Navigation - Client Component with role-based filtering */}
            <SidebarNav userRole={userRole} subscriptionTier={practice?.subscriptionTier} unreadNotifications={unreadNotifications} />

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
                    {getAccessLevelDisplayName(userRole)}
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
