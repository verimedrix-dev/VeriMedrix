"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Users, MoreHorizontal, UserPlus, Shield, UserMinus, RefreshCw, Loader2, Mail, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { UserRole } from "@prisma/client";
import {
  getTeamMembers,
  getEligibleEmployees,
  getPendingInvitations,
  sendTeamInvitation,
  cancelInvitation,
  resendInvitation,
  changeTeamMemberRole,
  removeTeamMember,
  reactivateTeamMember,
  getTeamLimitStatus,
} from "@/lib/actions/team";
import { useRefresh } from "@/hooks/use-refresh";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
};

type EligibleEmployee = {
  id: string;
  fullName: string;
  email: string | null;
  position: string | null;
};

type PendingInvitation = {
  id: string;
  email: string;
  role: UserRole;
  expiresAt: Date;
  Employee: {
    id: string;
    fullName: string;
    email: string | null;
    position: string | null;
  };
  InvitedBy: {
    id: string;
    name: string;
  };
};

type LimitStatus = {
  isLimitReached: boolean;
  currentCount: number;
  pendingCount: number;
  maxUsers: number | null;
  tier: string;
  tierDisplayName: string;
  remainingSlots: number | null;
  canInvite: boolean;
};

const roleColors: Record<UserRole, { bg: string; text: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  SUPER_ADMIN: { bg: "bg-red-100", text: "text-red-700", variant: "destructive" },
  PRACTICE_OWNER: { bg: "bg-blue-100", text: "text-blue-700", variant: "default" },
  ADMIN: { bg: "bg-green-100", text: "text-green-700", variant: "secondary" },
  STAFF: { bg: "bg-purple-100", text: "text-purple-700", variant: "outline" },
  VIEWER: { bg: "bg-slate-100", text: "text-slate-700", variant: "outline" },
  LOCUM: { bg: "bg-amber-100", text: "text-amber-700", variant: "outline" },
};

const roleDisplayNames: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  PRACTICE_OWNER: "Owner",
  ADMIN: "Full Access",
  STAFF: "Intermediate",
  VIEWER: "Minimum Access",
  LOCUM: "Locum",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-purple-100 text-purple-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
    "bg-indigo-100 text-indigo-700",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export function TeamSettings() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [eligibleEmployees, setEligibleEmployees] = useState<EligibleEmployee[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [limitStatus, setLimitStatus] = useState<LimitStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("STAFF");
  const [isInviting, setIsInviting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { refresh } = useRefresh();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [membersData, employeesData, invitationsData, limitData] = await Promise.all([
        getTeamMembers(),
        getEligibleEmployees(),
        getPendingInvitations(),
        getTeamLimitStatus(),
      ]);
      setMembers(membersData as TeamMember[]);
      setEligibleEmployees(employeesData);
      setPendingInvitations(invitationsData as PendingInvitation[]);
      setLimitStatus(limitData);
    } catch (error) {
      console.error("Failed to load team data:", error);
      toast.error("Failed to load team data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInvite = async () => {
    if (!selectedEmployee || !selectedRole) {
      toast.error("Please select an employee and role");
      return;
    }

    setIsInviting(true);
    try {
      await sendTeamInvitation({
        employeeId: selectedEmployee,
        role: selectedRole,
      });
      toast.success("Invitation sent successfully");
      setInviteDialogOpen(false);
      setSelectedEmployee("");
      setSelectedRole("STAFF");
      loadData();
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      await cancelInvitation(invitationId);
      toast.success("Invitation cancelled");
      loadData();
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel invitation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      await resendInvitation(invitationId);
      toast.success("Invitation resent");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resend invitation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    setActionLoading(userId);
    try {
      await changeTeamMemberRole(userId, newRole);
      toast.success("Role updated");
      loadData();
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to change role");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setActionLoading(userId);
    try {
      await removeTeamMember(userId);
      toast.success("Team member removed");
      loadData();
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove team member");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivateMember = async (userId: string) => {
    setActionLoading(userId);
    try {
      await reactivateTeamMember(userId);
      toast.success("Team member reactivated");
      loadData();
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reactivate team member");
    } finally {
      setActionLoading(null);
    }
  };

  const activeMembers = members.filter((m) => m.isActive);
  const inactiveMembers = members.filter((m) => !m.isActive);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            <span className="ml-2 text-slate-500">Loading team data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Members Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage users who have access to this practice
                {limitStatus && limitStatus.maxUsers && (
                  <span className="ml-2 text-xs">
                    ({limitStatus.currentCount}/{limitStatus.maxUsers} users)
                  </span>
                )}
              </CardDescription>
            </div>
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!limitStatus?.canInvite}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Select an employee to invite to the system. They will receive an email with instructions to set up their account.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Employee</Label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleEmployees.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No eligible employees
                          </SelectItem>
                        ) : (
                          eligibleEmployees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.fullName} ({emp.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {eligibleEmployees.length === 0 && (
                      <p className="text-xs text-slate-500">
                        All employees either already have accounts or pending invitations.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Access Level</Label>
                    <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Full Access - Can manage all areas</SelectItem>
                        <SelectItem value="STAFF">Intermediate - Standard team member access</SelectItem>
                        <SelectItem value="VIEWER">Minimum Access - View only access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInvite} disabled={isInviting || !selectedEmployee}>
                    {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Invitation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!limitStatus?.canInvite && limitStatus?.maxUsers && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                User limit reached ({limitStatus.currentCount}/{limitStatus.maxUsers}). Upgrade your plan to add more team members.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {activeMembers.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No team members found</p>
            ) : (
              activeMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${getAvatarColor(member.name)}`}
                    >
                      <span className="font-medium">{getInitials(member.name)}</span>
                    </div>
                    <div>
                      <p className="font-medium dark:text-white">{member.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={roleColors[member.role]?.variant || "outline"}>
                      {roleDisplayNames[member.role] || member.role}
                    </Badge>
                    {member.role !== "PRACTICE_OWNER" && member.role !== "SUPER_ADMIN" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={actionLoading === member.id}>
                            {actionLoading === member.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleChangeRole(member.id, "ADMIN")}>
                            <Shield className="h-4 w-4 mr-2" />
                            Set Full Access
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleChangeRole(member.id, "STAFF")}>
                            <Users className="h-4 w-4 mr-2" />
                            Set Intermediate Access
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleChangeRole(member.id, "VIEWER")}>
                            <Users className="h-4 w-4 mr-2" />
                            Set Minimum Access
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove from Team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations
            </CardTitle>
            <CardDescription>
              Invitations that are awaiting acceptance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium dark:text-white">{invitation.Employee.fullName}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{invitation.email}</p>
                      <p className="text-xs text-slate-400">
                        Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{roleDisplayNames[invitation.role]}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResendInvitation(invitation.id)}
                      disabled={actionLoading === invitation.id}
                    >
                      {actionLoading === invitation.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleCancelInvitation(invitation.id)}
                      disabled={actionLoading === invitation.id}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inactive Members */}
      {inactiveMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-500">
              <UserMinus className="h-5 w-5" />
              Inactive Members
            </CardTitle>
            <CardDescription>
              Team members who have been removed but can be reactivated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inactiveMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                      <span className="text-slate-500 font-medium">{getInitials(member.name)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-500">{member.name}</p>
                      <p className="text-sm text-slate-400">{member.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReactivateMember(member.id)}
                    disabled={actionLoading === member.id || !limitStatus?.canInvite}
                  >
                    {actionLoading === member.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Reactivate
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
