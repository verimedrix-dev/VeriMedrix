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
  Ban,
  CheckCircle,
  Shield,
  UserCog,
  Loader2,
} from "lucide-react";
import { suspendUser, activateUser, updateUserRole, reset2FA } from "@/lib/actions/admin/users";
import { UserRole } from "@prisma/client";

interface UserActionsProps {
  userId: string;
  currentRole: UserRole;
  isActive: boolean;
  twoFactorEnabled: boolean;
}

export function UserActions({ userId, currentRole, isActive, twoFactorEnabled }: UserActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showReset2FADialog, setShowReset2FADialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);

  const handleChangeRole = () => {
    startTransition(async () => {
      await updateUserRole(userId, selectedRole);
      setShowRoleDialog(false);
    });
  };

  const handleSuspend = () => {
    startTransition(async () => {
      await suspendUser(userId);
      setShowSuspendDialog(false);
    });
  };

  const handleActivate = () => {
    startTransition(async () => {
      await activateUser(userId);
    });
  };

  const handleReset2FA = () => {
    startTransition(async () => {
      await reset2FA(userId);
      setShowReset2FADialog(false);
    });
  };

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
          <DropdownMenuItem onClick={() => setShowRoleDialog(true)}>
            <UserCog className="h-4 w-4 mr-2" />
            Change Role
          </DropdownMenuItem>
          {twoFactorEnabled && (
            <DropdownMenuItem onClick={() => setShowReset2FADialog(true)}>
              <Shield className="h-4 w-4 mr-2" />
              Reset 2FA
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {isActive ? (
            <DropdownMenuItem
              onClick={() => setShowSuspendDialog(true)}
              className="text-red-600"
            >
              <Ban className="h-4 w-4 mr-2" />
              Suspend User
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleActivate} disabled={isPending}>
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Reactivate User
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Change Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for this user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Role</Label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="PRACTICE_OWNER">Practice Owner</option>
                <option value="ADMIN">Admin</option>
                <option value="STAFF">Staff</option>
                <option value="VIEWER">Viewer</option>
                <option value="LOCUM">Locum</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeRole} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              This will prevent the user from logging in. This action can be reversed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSuspend} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset 2FA Dialog */}
      <Dialog open={showReset2FADialog} onOpenChange={setShowReset2FADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              This will disable 2FA for this user. They will need to set it up again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReset2FADialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReset2FA} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reset 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
