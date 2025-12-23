"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
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
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
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
  const [loading, setLoading] = useState(false);

  const isConfirmed = confirmText === practiceName;

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setLoading(true);
    try {
      await deletePracticeAccount(confirmText);

      // Sign out the user from Supabase
      const supabase = createClient();
      await supabase.auth.signOut();

      toast.success("Your account has been permanently deleted");

      // Redirect to home page
      router.push("/");
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete account");
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full sm:w-auto">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Account Permanently
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                This action <strong>cannot be undone</strong>. This will permanently delete your
                practice account and remove all associated data, including:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 text-slate-600 dark:text-slate-400">
                <li>All employees and their records</li>
                <li>All documents and compliance data</li>
                <li>All payroll history and reports</li>
                <li>All tasks and schedules</li>
                <li>All team members and invitations</li>
                <li>Your subscription will be cancelled immediately</li>
              </ul>
              <div className="pt-2">
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
          <AlertDialogCancel disabled={loading} onClick={() => setConfirmText("")}>
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
                Delete Account Forever
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
