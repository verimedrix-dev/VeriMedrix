"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  MoreVertical,
  ArrowUpCircle,
  ArrowDownCircle,
  Ban,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { updatePracticeSubscription, suspendPractice, activatePractice } from "@/lib/actions/admin/practices";
import { SubscriptionTier, SubscriptionStatus } from "@prisma/client";

interface PracticeActionsProps {
  practiceId: string;
  currentTier: SubscriptionTier;
  currentStatus: SubscriptionStatus;
}

export function PracticeActions({ practiceId, currentTier, currentStatus }: PracticeActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showTierDialog, setShowTierDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(currentTier);

  const handleChangeTier = () => {
    startTransition(async () => {
      await updatePracticeSubscription(practiceId, { tier: selectedTier });
      setShowTierDialog(false);
    });
  };

  const handleSuspend = () => {
    startTransition(async () => {
      await suspendPractice(practiceId);
      setShowSuspendDialog(false);
    });
  };

  const handleActivate = () => {
    startTransition(async () => {
      await activatePractice(practiceId);
    });
  };

  const isSuspended = currentStatus === "CANCELLED";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowTierDialog(true)}>
            <ArrowUpCircle className="h-4 w-4 mr-2" />
            Change Subscription Tier
          </DropdownMenuItem>
          {isSuspended ? (
            <DropdownMenuItem onClick={handleActivate} disabled={isPending}>
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Reactivate Practice
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setShowSuspendDialog(true)}
              className="text-red-600"
            >
              <Ban className="h-4 w-4 mr-2" />
              Suspend Practice
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Change Tier Dialog */}
      <Dialog open={showTierDialog} onOpenChange={setShowTierDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Subscription Tier</DialogTitle>
            <DialogDescription>
              Update the subscription tier for this practice.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Tier</Label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value as SubscriptionTier)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="ESSENTIALS">Essentials</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTierDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeTier} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Tier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Practice</DialogTitle>
            <DialogDescription>
              This will deactivate all users in the practice and prevent access.
              This action can be reversed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSuspend} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Suspend Practice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
