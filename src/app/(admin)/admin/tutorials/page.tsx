import { getAllTutorials } from "@/lib/actions/tutorials";
import { AdminTutorialsClient } from "@/components/admin/admin-tutorials-client";

export const dynamic = "force-dynamic";

export default async function AdminTutorialsPage() {
  const tutorials = await getAllTutorials();

  return <AdminTutorialsClient initialTutorials={tutorials} />;
}
