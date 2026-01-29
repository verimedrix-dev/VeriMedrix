import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { getInventoryDashboardData, checkInventoryAlerts } from "@/lib/actions/inventory";
import { UpgradePrompt } from "@/components/inventory/upgrade-prompt";
import { InventoryDashboardClient } from "@/components/inventory/inventory-dashboard-client";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  await requirePermission(PERMISSIONS.PAYROLL);

  const data = await getInventoryDashboardData();

  // Show upgrade prompt if feature not available
  if (data && "featureNotAvailable" in data && data.featureNotAvailable) {
    return <UpgradePrompt />;
  }

  // Check for inventory alerts (low stock, expiring, expired) and create notifications
  checkInventoryAlerts().catch(() => {});

  // Pass data to client component for interactivity (cast after feature gate check)
  return <InventoryDashboardClient initialData={data as import("@/lib/inventory-utils").InventoryDashboardData | null} />;
}
