import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma, withDbConnection } from "@/lib/prisma";
import { ensureUserAndPractice } from "@/lib/actions/practice";
import { Users, Mail, Phone, AlertTriangle } from "lucide-react";
import { InviteTeamMemberDialog } from "@/components/team/invite-dialog";
import { TeamMemberActions } from "@/components/team/team-member-actions";
import { PendingInvitations } from "@/components/team/pending-invitations";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS, getAccessLevelDisplayName } from "@/lib/permissions";
import { checkUserLimitStatus } from "@/lib/subscription-limits";
import Link from "next/link";

export default async function TeamPage() {
  // Only practice owners can access the team page
  await requirePermission(PERMISSIONS.TEAM);

  const { practice } = await ensureUserAndPractice();

  const [teamMembers, pendingInvitations, limitStatus] = await Promise.all([
    practice
      ? withDbConnection(() =>
          prisma.user.findMany({
            where: { practiceId: practice.id },
            orderBy: [{ role: "asc" }, { createdAt: "asc" }],
          })
        )
      : [],
    practice
      ? withDbConnection(() =>
          prisma.teamInvitation.findMany({
            where: {
              practiceId: practice.id,
              status: "PENDING",
            },
            include: {
              Employee: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  position: true,
                },
              },
              InvitedBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          })
        )
      : [],
    practice ? checkUserLimitStatus(practice.id) : null,
  ]);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "PRACTICE_OWNER":
        return "default";
      case "ADMIN":
        return "secondary";
      case "STAFF":
        return "outline";
      case "VIEWER":
        return "outline";
      default:
        return "outline";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
      "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
      "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
      "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Team</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your practice team members and their access
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* User Count Badge */}
          {limitStatus && (
            <div className="flex items-center gap-2">
              {limitStatus.maxUsers !== null ? (
                <Badge
                  variant={limitStatus.isLimitReached ? "destructive" : "secondary"}
                  className="text-sm px-3 py-1"
                >
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  {limitStatus.currentCount}/{limitStatus.maxUsers} users
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  {limitStatus.currentCount} users
                </Badge>
              )}
            </div>
          )}
          <InviteTeamMemberDialog />
        </div>
      </div>

      {/* Limit Warning Banner */}
      {limitStatus?.isLimitReached && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-amber-800 dark:text-amber-200">
              User limit reached
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Your {limitStatus.tierDisplayName} plan allows {limitStatus.maxUsers} users.
              Upgrade to Professional for unlimited team members.
            </p>
          </div>
          <Link
            href="/settings?tab=billing"
            className="shrink-0 inline-flex items-center px-4 py-2 rounded-md bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            Upgrade Plan
          </Link>
        </div>
      )}

      {/* Pending Invitations */}
      <PendingInvitations invitations={pendingInvitations} />

      {/* Team Members */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teamMembers.map((member, index) => {
          const isOwner = member.role === "PRACTICE_OWNER" || member.role === "SUPER_ADMIN";

          return (
            <Card key={member.id} className={!member.isActive ? "opacity-60" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`h-12 w-12 rounded-full flex items-center justify-center ${getAvatarColor(index)}`}
                  >
                    <span className="font-semibold">{getInitials(member.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                          {member.name}
                        </h3>
                      </div>
                      <TeamMemberActions
                        userId={member.id}
                        userName={member.name}
                        currentRole={member.role}
                        isActive={member.isActive}
                        isOwner={isOwner}
                      />
                    </div>
                    <Badge variant={getRoleBadgeVariant(member.role)} className="mt-1">
                      {getAccessLevelDisplayName(member.role)}
                    </Badge>
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Phone className="h-4 w-4" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                    </div>
                    {!member.isActive && (
                      <div className="mt-3">
                        <Badge variant="destructive" className="text-xs">
                          Inactive
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {teamMembers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-slate-400 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No team members yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Start by inviting your first team member to collaborate on compliance management.
            </p>
            <InviteTeamMemberDialog />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
