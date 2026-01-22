"use client";

import { useState } from "react";
import { useRefresh } from "@/hooks/use-refresh";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Mail, RefreshCw, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cancelInvitation, resendInvitation } from "@/lib/actions/team";
import { getAccessLevelDisplayName } from "@/lib/permissions";
import { formatDistanceToNow } from "date-fns";
import { UserRole } from "@prisma/client";

interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  expiresAt: Date;
  createdAt: Date;
  invitedByName: string | null;
  Employee: {
    id: string;
    fullName: string;
    email: string | null;
    position: string;
  } | null;
  InvitedBy: {
    id: string;
    name: string;
  } | null;
}

interface PendingInvitationsProps {
  invitations: Invitation[];
}

export function PendingInvitations({ invitations }: PendingInvitationsProps) {
  const { refresh } = useRefresh();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  if (invitations.length === 0) {
    return null;
  }

  const handleCancel = async (invitationId: string) => {
    setLoadingAction(invitationId);
    try {
      await cancelInvitation(invitationId);
      refresh();
      toast.success("Invitation cancelled");
    } catch (error) {
      console.error("Failed to cancel invitation:", error);
      toast.error(error instanceof Error ? error.message : "Failed to cancel invitation");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResend = async (invitationId: string, employeeName: string) => {
    setLoadingAction(invitationId);
    try {
      await resendInvitation(invitationId);
      refresh();
      toast.success(`Invitation resent to ${employeeName}`);
    } catch (error) {
      console.error("Failed to resend invitation:", error);
      toast.error(error instanceof Error ? error.message : "Failed to resend invitation");
    } finally {
      setLoadingAction(null);
    }
  };

  const isExpired = (expiresAt: Date) => new Date() > new Date(expiresAt);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          Pending Invitations
        </CardTitle>
        <CardDescription>
          These team members have been invited but haven&apos;t accepted yet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invitations.map((invitation) => {
            const expired = isExpired(invitation.expiresAt);
            const isLoading = loadingAction === invitation.id;

            return (
              <div
                key={invitation.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  expired ? "bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800" : "bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {invitation.Employee?.fullName || invitation.email}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{invitation.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {getAccessLevelDisplayName(invitation.role)}
                      </Badge>
                      {expired ? (
                        <Badge variant="destructive" className="text-xs">
                          Expired
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Expires {formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResend(invitation.id, invitation.Employee?.fullName || invitation.email)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Resend
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancel(invitation.id)}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
