import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { getCustomForm, FormField, FormSchedule } from "@/lib/actions/forms";
import { FormBuilder } from "@/components/forms/form-builder";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface EditFormPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFormPage({ params }: EditFormPageProps) {
  await requirePermission(PERMISSIONS.FORMS_CREATE);
  const { id } = await params;

  const form = await getCustomForm(id);

  if (!form) {
    notFound();
  }

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Form</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {form.name}
          </p>
        </div>
      </div>

      <FormBuilder
        existingForm={{
          id: form.id,
          name: form.name,
          description: form.description,
          fields: form.fields as unknown as FormField[],
          schedule: form.schedule as FormSchedule,
          isActive: form.isActive,
        }}
      />
    </div>
  );
}
