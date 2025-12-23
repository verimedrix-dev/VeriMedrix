"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Loader2, AlertTriangle, Clock, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { deletePracticeAccount } from "@/lib/actions/practice";
import { createClient } from "@/lib/supabase/client";

interface DeleteAccountDialogProps {
  practiceName: string;
}

export function DeleteAccountDialog({ practiceName }: DeleteAccountDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const isConfirmed = confirmText === practiceName;

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setLoading(true);
    try {
      const result = await deletePracticeAccount(confirmText, reason || undefined);

      // Sign out the user from Supabase
      const supabase = createClient();
      await supabase.auth.signOut();

      const deletionDate = new Date(result.deletionDate).toLocaleDateString("en-ZA", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      toast.success(
        `Your account has been scheduled for deletion on ${deletionDate}. Check your email for more details.`,
        { duration: 8000 }
      );

      // Redirect to home page
      router.push("/");
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete account");
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setConfirmText("");
      setReason("");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full sm:w-auto">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Practice Account
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {/* 30-day grace period notice */}
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      30-Day Grace Period
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Your data will be retained for 30 days before permanent deletion.
                      You can reactivate your account at any time during this period.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    You&apos;ll receive an email confirmation with instructions on how to recover your account.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <RefreshCw className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Your subscription will be cancelled immediately, but you won&apos;t be charged again.
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400">
                After the 30-day period, the following data will be <strong className="text-red-600">permanently deleted</strong>:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 text-slate-600 dark:text-slate-400 ml-2">
                <li>All employees and their records</li>
                <li>All documents and compliance data</li>
                <li>All payroll history and reports</li>
                <li>All tasks, schedules, and team members</li>
              </ul>

              {/* Optional reason */}
              <div>
                <Label htmlFor="delete-reason" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Why are you leaving? (optional)
                </Label>
                <Textarea
                  id="delete-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Help us improve by sharing your feedback..."
                  className="mt-2 resize-none"
                  rows={2}
                />
              </div>

              {/* Confirmation input */}
              <div className="pt-2 border-t">
                <Label htmlFor="confirm-delete" className="text-sm font-medium">
                  Type <span className="font-bold text-red-600">{practiceName}</span> to confirm:
                </Label>
                <Input
                  id="confirm-delete"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Enter practice name"
                  className="mt-2"
                  autoComplete="off"
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Schedule Deletion
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
