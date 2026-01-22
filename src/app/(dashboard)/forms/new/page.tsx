import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { FormBuilder } from "@/components/forms/form-builder";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewFormPage() {
  await requirePermission(PERMISSIONS.LOGBOOK_CRUD);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/forms">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Form</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Build a custom form for checklists, logs, or other records
          </p>
        </div>
      </div>

      <FormBuilder />
    </div>
  );
}
