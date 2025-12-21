"use client";

import { useState, useEffect } from "react";
import { useRefresh } from "@/hooks/use-refresh";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, Loader2, Mail, User, Shield, AlertTriangle, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { UserRole, SubscriptionTier } from "@prisma/client";
import { getEligibleEmployees, sendTeamInvitation, getTeamLimitStatus } from "@/lib/actions/team";
import { getInvitableRoles, getAccessLevelDescription } from "@/lib/permissions";
import Link from "next/link";

interface EligibleEmployee {
  id: string;
  fullName: string;
  email: string | null;
  position: string;
}

interface LimitStatus {
  isLimitReached: boolean;
  currentCount: number;
  pendingCount: number;
  maxUsers: number | null;
  tier: SubscriptionTier;
  tierDisplayName: string;
  remainingSlots: number | null;
  canInvite: boolean;
}

export function InviteTeamMemberDialog() {
  const { refresh, isPending } = useRefresh();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employees, setEmployees] = useState<EligibleEmployee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("STAFF");
  const [limitStatus, setLimitStatus] = useState<LimitStatus | null>(null);

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);
  const invitableRoles = getInvitableRoles();

  useEffect(() => {
    if (open) {
      loadEligibleEmployees();
      loadLimitStatus();
    }
  }, [open]);

  const loadEligibleEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const eligibleEmployees = await getEligibleEmployees();
      setEmployees(eligibleEmployees);
    } catch (error) {
      console.error("Failed to load eligible employees:", error);
      toast.error("Failed to load employees");
    } finally {
      setLoadingEmployees(false);
    }
  };

  const loadLimitStatus = async () => {
    try {
      const status = await getTeamLimitStatus();
      setLimitStatus(status);
    } catch (error) {
      console.error("Failed to load limit status:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployeeId) {
      toast.error("Please select an employee");
      return;
    }

    setLoading(true);

    try {
      await sendTeamInvitation({
        employeeId: selectedEmployeeId,
        role: selectedRole,
      });

      setOpen(false);
      setSelectedEmployeeId("");
      setSelectedRole("STAFF");
      refresh();
      toast.success(`Invitation sent to ${selectedEmployee?.fullName}`);
    } catch (error) {
      console.error("Failed to send invitation:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSelectedEmployeeId("");
      setSelectedRole("STAFF");
      setLimitStatus(null);
    }
  };

  const isLimitReached = limitStatus?.isLimitReached ?? false;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Select an employee to invite to your team. They will receive an email to create their account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Limit Status Banner */}
            {limitStatus && (
              isLimitReached ? (
                <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex flex-col gap-2">
                    <span>
                      <strong>User limit reached.</strong> Your {limitStatus.tierDisplayName} plan allows {limitStatus.maxUsers} users.
                      You have {limitStatus.currentCount} active users
                      {limitStatus.pendingCount > 0 && ` and ${limitStatus.pendingCount} pending invitation${limitStatus.pendingCount > 1 ? "s" : ""}`}.
                    </span>
                    <Link
                      href="/settings?tab=billing"
                      className="inline-flex items-center gap-1 text-sm font-medium text-red-700 dark:text-red-300 hover:underline"
                    >
                      Upgrade to Professional for unlimited users
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </AlertDescription>
                </Alert>
              ) : limitStatus.remainingSlots !== null && limitStatus.remainingSlots <= 2 ? (
                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    <strong>{limitStatus.remainingSlots} slot{limitStatus.remainingSlots !== 1 ? "s" : ""} remaining</strong> on your {limitStatus.tierDisplayName} plan ({limitStatus.currentCount}/{limitStatus.maxUsers} users).
                  </AlertDescription>
                </Alert>
              ) : null
            )}
            {/* Employee Selection */}
            <div className="space-y-2">
              <Label htmlFor="employee">Select Employee</Label>
              {loadingEmployees ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center py-4 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg border dark:border-slate-700">
                  <User className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">No eligible employees found</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    Employees must have an email address and not already have an account.
                  </p>
                </div>
              ) : (
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        <div className="flex flex-col">
                          <span>{employee.fullName}</span>
                          <span className="text-xs text-slate-500">{employee.position}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Show selected employee details */}
            {selectedEmployee && (
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-slate-600 dark:text-slate-400">Invitation will be sent to:</span>
                </div>
                <p className="font-medium text-slate-900 dark:text-white mt-1">{selectedEmployee.email}</p>
              </div>
            )}

            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role">Access Level</Label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  {invitableRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{role.label}</span>
                        <span className="text-xs text-slate-500">{role.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Access level description */}
              <div className="flex items-start gap-2 mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400">
                <Shield className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{getAccessLevelDescription(selectedRole)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || isPending || !selectedEmployeeId || employees.length === 0 || isLimitReached}
            >
              {(loading || isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
