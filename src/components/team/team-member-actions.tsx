"use client";

import { useState } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Shield, UserMinus, UserCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { UserRole } from "@prisma/client";
import { changeTeamMemberRole, removeTeamMember, reactivateTeamMember } from "@/lib/actions/team";
import { getAccessLevelDisplayName, getInvitableRoles } from "@/lib/permissions";

interface TeamMemberActionsProps {
  userId: string;
  userName: string;
  currentRole: UserRole;
  isActive: boolean;
  isOwner: boolean;
}

export function TeamMemberActions({
  userId,
  userName,
  currentRole,
  isActive,
  isOwner,
}: TeamMemberActionsProps) {
  const [loading, setLoading] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const invitableRoles = getInvitableRoles();

  // Can't manage the owner
  if (isOwner) {
    return null;
  }

  const handleRoleChange = async (newRole: UserRole) => {
    if (newRole === currentRole) return;

    setLoading(true);
    try {
      await changeTeamMemberRole(userId, newRole);
      toast.success(`Changed ${userName}'s role to ${getAccessLevelDisplayName(newRole)}`);
    } catch (error) {
      console.error("Failed to change role:", error);
      toast.error(error instanceof Error ? error.message : "Failed to change role");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      await removeTeamMember(userId);
      toast.success(`${userName} has been deactivated`);
      setShowRemoveDialog(false);
    } catch (error) {
      console.error("Failed to remove member:", error);
      toast.error(error instanceof Error ? error.message : "Failed to remove member");
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    setLoading(true);
    try {
      await reactivateTeamMember(userId);
      toast.success(`${userName} has been reactivated`);
    } catch (error) {
      console.error("Failed to reactivate member:", error);
      toast.error(error instanceof Error ? error.message : "Failed to reactivate member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Change Access Level</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {invitableRoles.map((role) => (
            <DropdownMenuItem
              key={role.value}
              onClick={() => handleRoleChange(role.value)}
              disabled={currentRole === role.value}
            >
              <Shield className="h-4 w-4 mr-2" />
              <div className="flex flex-col">
                <span className={currentRole === role.value ? "font-medium" : ""}>
                  {role.label}
                  {currentRole === role.value && " (current)"}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {isActive ? (
            <DropdownMenuItem
              onClick={() => setShowRemoveDialog(true)}
              className="text-red-600 focus:text-red-600"
            >
              <UserMinus className="h-4 w-4 mr-2" />
              Deactivate Member
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleReactivate}>
              <UserCheck className="h-4 w-4 mr-2" />
              Reactivate Member
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Team Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate {userName}&apos;s account. They will no longer be able to access the system.
              You can reactivate them later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deactivating...
                </>
              ) : (
                "Deactivate"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
