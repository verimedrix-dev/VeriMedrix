import { getServiceProviderDirectory } from "@/lib/actions/service-providers";
import { getCurrentUserRole } from "@/lib/actions/personal";
import { ProviderDirectoryClient } from "@/components/service-providers/provider-directory-client";

export const dynamic = "force-dynamic";

export default async function ServiceProvidersPage() {
  const [data, userRole] = await Promise.all([
    getServiceProviderDirectory(),
    getCurrentUserRole(),
  ]);

  const isSuperAdmin = userRole === "SUPER_ADMIN";

  return (
    <ProviderDirectoryClient
      providers={data?.providers || []}
      categories={data?.categories || []}
      totalProviders={data?.totalProviders || 0}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
