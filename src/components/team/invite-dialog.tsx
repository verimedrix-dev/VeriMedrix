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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserPlus, Loader2, Mail, User, AlertTriangle, ArrowUpRight, Briefcase, Building } from "lucide-react";
import { toast } from "sonner";
import { UserRole, SubscriptionTier, LocumSourceType } from "@prisma/client";
import { getEligibleEmployees, getEligibleLocums, sendTeamInvitation, sendLocumInvitation, getTeamLimitStatus } from "@/lib/actions/team";
import { getInvitableRoles } from "@/lib/permissions";
import Link from "next/link";

interface EligibleEmployee {
  id: string;
  fullName: string;
  email: string | null;
  position: string;
}

interface EligibleLocum {
  id: string;
  fullName: string;
  email: string | null;
  sourceType: LocumSourceType;
  agencyName: string | null;
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
  const [loadingData, setLoadingData] = useState(false);
  const [inviteType, setInviteType] = useState<"employee" | "locum">("employee");

  // Employee state
  const [employees, setEmployees] = useState<EligibleEmployee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("STAFF");

  // Locum state
  const [locums, setLocums] = useState<EligibleLocum[]>([]);
  const [selectedLocumId, setSelectedLocumId] = useState("");

  const [limitStatus, setLimitStatus] = useState<LimitStatus | null>(null);

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);
  const selectedLocum = locums.find((l) => l.id === selectedLocumId);
  const invitableRoles = getInvitableRoles();

  useEffect(() => {
    if (open) {
      loadData();
      loadLimitStatus();
    }
  }, [open]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [eligibleEmployees, eligibleLocums] = await Promise.all([
        getEligibleEmployees(),
        getEligibleLocums(),
      ]);
      setEmployees(eligibleEmployees);
      setLocums(eligibleLocums);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load eligible members");
    } finally {
      setLoadingData(false);
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

    if (inviteType === "employee") {
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
        resetState();
        refresh();
        toast.success(`Invitation sent to ${selectedEmployee?.fullName}`);
      } catch (error) {
        console.error("Failed to send invitation:", error);
        toast.error(error instanceof Error ? error.message : "Failed to send invitation");
      } finally {
        setLoading(false);
      }
    } else {
      if (!selectedLocumId) {
        toast.error("Please select a locum");
        return;
      }

      setLoading(true);
      try {
        await sendLocumInvitation({
          locumId: selectedLocumId,
        });

        setOpen(false);
        resetState();
        refresh();
        toast.success(`Invitation sent to ${selectedLocum?.fullName}`);
      } catch (error) {
        console.error("Failed to send invitation:", error);
        toast.error(error instanceof Error ? error.message : "Failed to send invitation");
      } finally {
        setLoading(false);
      }
    }
  };

  const resetState = () => {
    setSelectedEmployeeId("");
    setSelectedLocumId("");
    setSelectedRole("STAFF");
    setInviteType("employee");
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetState();
      setLimitStatus(null);
    }
  };

  const isLimitReached = limitStatus?.isLimitReached ?? false;
  const canSubmitEmployee = !loading && !isPending && selectedEmployeeId && employees.length > 0 && !isLimitReached;
  const canSubmitLocum = !loading && !isPending && selectedLocumId && locums.length > 0 && !isLimitReached;

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
              Invite an employee or locum to your team. They will receive an email to create their account.
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

            {/* Tabs for Employee vs Locum */}
            <Tabs value={inviteType} onValueChange={(v) => setInviteType(v as "employee" | "locum")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="employee" className="gap-2">
                  <Briefcase className="h-4 w-4" />
                  Employee
                </TabsTrigger>
                <TabsTrigger value="locum" className="gap-2">
                  <Building className="h-4 w-4" />
                  Locum
                </TabsTrigger>
              </TabsList>

              {/* Employee Tab */}
              <TabsContent value="employee" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="employee">Select Employee</Label>
                  {loadingData ? (
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

                {/* Role Selection for Employees */}
                <div className="space-y-3">
                  <Label>Access Level</Label>
                  <RadioGroup
                    value={selectedRole}
                    onValueChange={(value) => setSelectedRole(value as UserRole)}
                    className="space-y-3"
                  >
                    {invitableRoles.map((role) => (
                      <label
                        key={role.value}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedRole === role.value
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <RadioGroupItem value={role.value} className="mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white">{role.label}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{role.description}</p>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              </TabsContent>

              {/* Locum Tab */}
              <TabsContent value="locum" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="locum">Select Locum</Label>
                  {loadingData ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    </div>
                  ) : locums.length === 0 ? (
                    <div className="text-center py-4 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg border dark:border-slate-700">
                      <Building className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">No eligible locums found</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        Locums must have an email address and not already have an account.
                      </p>
                    </div>
                  ) : (
                    <Select value={selectedLocumId} onValueChange={setSelectedLocumId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a locum..." />
                      </SelectTrigger>
                      <SelectContent>
                        {locums.map((locum) => (
                          <SelectItem key={locum.id} value={locum.id}>
                            <div className="flex flex-col">
                              <span>{locum.fullName}</span>
                              <span className="text-xs text-slate-500">
                                {locum.sourceType === "AGENCY" ? locum.agencyName || "Agency" : "Direct"}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Show selected locum details */}
                {selectedLocum && (
                  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-slate-600 dark:text-slate-400">Invitation will be sent to:</span>
                    </div>
                    <p className="font-medium text-slate-900 dark:text-white mt-1">{selectedLocum.email}</p>
                  </div>
                )}

                {/* Locum Access Info */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Locum Access</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Locums can view their timesheets, hours worked, and payment history.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={inviteType === "employee" ? !canSubmitEmployee : !canSubmitLocum}
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
