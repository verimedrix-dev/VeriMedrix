import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { getAdminUser } from "@/lib/admin-auth";
import { getCurrentUser } from "@/lib/actions/practice";
import { VeyroLogoFull } from "@/components/ui/veyro-logo";
import { Separator } from "@/components/ui/separator";
import { AdminSignOutButton } from "@/components/admin/admin-sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardThemeProvider } from "@/components/layout/dashboard-theme-provider";

function AdminLoading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
    </div>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminUser();

  if (!admin) {
    // Check if user is authenticated but not a super admin
    const user = await getCurrentUser();
    if (user) {
      // User is logged in but not a super admin - redirect to main dashboard
      redirect("/dashboard");
    }
    // Not authenticated at all - go to admin login
    redirect("/admin-login");
  }

  return (
    <DashboardThemeProvider>
      <div className="min-h-screen bg-background">
        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <VeyroLogoFull />
              </div>
            </div>

            {/* Navigation */}
            <AdminSidebar />

            <Separator />

            {/* Theme Toggle */}
            <div className="px-4 py-2">
              <ThemeToggle />
            </div>

            <Separator />

            {/* User Section */}
            <div className="p-4">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-medium text-sm">
                    {admin.name?.charAt(0).toUpperCase() || "A"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {admin.name || admin.email}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Super Admin
                  </p>
                </div>
              </div>
              <AdminSignOutButton />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="pl-64">
          <div className="p-8">
            <Suspense fallback={<AdminLoading />}>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
    </DashboardThemeProvider>
  );
}
