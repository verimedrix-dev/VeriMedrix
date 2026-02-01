import { getServiceProviderDirectoryAdmin } from "@/lib/actions/admin/service-providers";
import { AdminServiceProvidersClient } from "@/components/admin/admin-service-providers-client";

export const dynamic = "force-dynamic";

export default async function AdminServiceProvidersPage() {
  const data = await getServiceProviderDirectoryAdmin();

  return (
    <AdminServiceProvidersClient
      providers={data?.providers || []}
      categories={data?.categories || []}
      totalProviders={data?.totalProviders || 0}
    />
  );
}
