"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, Loader2 } from "lucide-react";
import { markAllErrorsResolved } from "@/lib/actions/admin/health";
import { useRouter } from "next/navigation";

export function ErrorActions() {
  const [isPending, startTransition] = useTransition();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const router = useRouter();

  const handleResolveAll = () => {
    startTransition(async () => {
      await markAllErrorsResolved();
      setShowConfirmDialog(false);
      router.refresh();
    });
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowConfirmDialog(true)}
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        Mark All Resolved
      </Button>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark All Errors Resolved</DialogTitle>
            <DialogDescription>
              This will mark all unresolved errors as resolved. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolveAll} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
