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
import { Trash2, Loader2, AlertTriangle, XCircle } from "lucide-react";
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
      await deletePracticeAccount(confirmText, reason || undefined);

      // Sign out the user from Supabase
      const supabase = createClient();
      await supabase.auth.signOut();

      toast.success(
        "Your account has been permanently deleted. You will receive a confirmation email shortly.",
        { duration: 6000 }
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
              {/* Warning notice */}
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-200">
                      This action is permanent and cannot be undone
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      Your account and all data will be deleted immediately. There is no way to recover your data after deletion.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400">
                The following data will be <strong className="text-red-600">permanently deleted</strong>:
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
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Permanently
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
