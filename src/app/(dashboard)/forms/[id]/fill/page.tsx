import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { getCustomForm, FormField } from "@/lib/actions/forms";
import { FormFiller } from "@/components/forms/form-filler";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface FillFormPageProps {
  params: Promise<{ id: string }>;
}

export default async function FillFormPage({ params }: FillFormPageProps) {
  await requirePermission(PERMISSIONS.LOGBOOK);
  const { id } = await params;

  const form = await getCustomForm(id);

  if (!form) {
    notFound();
  }

  if (!form.isActive) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/forms">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{form.name}</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Form Inactive</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md">
            This form is currently inactive and cannot accept submissions.
          </p>
          <Link href="/forms" className="mt-4">
            <Button variant="outline">Back to Forms</Button>
          </Link>
        </div>
      </div>
    );
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Fill Form</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {form.name}
          </p>
        </div>
      </div>

      <FormFiller form={{ ...form, fields: form.fields as unknown as FormField[] }} />
    </div>
  );
}
