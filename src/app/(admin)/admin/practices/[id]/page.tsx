import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Users,
  FileText,
  CheckSquare,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Shield,
  Globe,
} from "lucide-react";
import { getAdminPracticeById } from "@/lib/actions/admin/practices";
import { format } from "date-fns";
import Link from "next/link";
import { PracticeActions } from "@/components/admin/practice-actions";

const PROVINCE_LABELS: Record<string, string> = {
  eastern_cape: "Eastern Cape",
  free_state: "Free State",
  gauteng: "Gauteng",
  kwazulu_natal: "KwaZulu-Natal",
  limpopo: "Limpopo",
  mpumalanga: "Mpumalanga",
  northern_cape: "Northern Cape",
  north_west: "North West",
  western_cape: "Western Cape",
};

export default async function AdminPracticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const practice = await getAdminPracticeById(id);

  if (!practice) {
    notFound();
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "PROFESSIONAL": return "bg-purple-100 text-purple-800";
      case "ENTERPRISE": return "bg-amber-100 text-amber-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800";
      case "TRIAL": return "bg-blue-100 text-blue-800";
      case "CANCELLED": return "bg-red-100 text-red-800";
      case "PAST_DUE": return "bg-amber-100 text-amber-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "PRACTICE_OWNER": return "bg-purple-100 text-purple-800";
      case "ADMIN": return "bg-blue-100 text-blue-800";
      case "STAFF": return "bg-green-100 text-green-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {practice.name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getTierColor(practice.subscriptionTier)}>
                {practice.subscriptionTier}
              </Badge>
              <Badge className={getStatusColor(practice.subscriptionStatus)}>
                {practice.subscriptionStatus}
              </Badge>
              {!practice.onboardingCompleted && (
                <Badge variant="outline">Onboarding Incomplete</Badge>
              )}
            </div>
          </div>
        </div>
        <PracticeActions
          practiceId={practice.id}
          currentTier={practice.subscriptionTier}
          currentStatus={practice.subscriptionStatus}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{practice._count.Employee}</p>
                <p className="text-sm text-slate-500">Employees</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{practice._count.Document}</p>
                <p className="text-sm text-slate-500">Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{practice._count.Task}</p>
                <p className="text-sm text-slate-500">Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-2xl font-bold">{practice.User.length}</p>
                <p className="text-sm text-slate-500">Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="users">Users ({practice.User.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Practice Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Email</p>
                      <p className="font-medium">{practice.email}</p>
                    </div>
                  </div>
                  {practice.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Phone</p>
                        <p className="font-medium">{practice.phone}</p>
                      </div>
                    </div>
                  )}
                  {practice.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Address</p>
                        <p className="font-medium">{practice.address}</p>
                      </div>
                    </div>
                  )}
                  {practice.province && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Province</p>
                        <p className="font-medium">{PROVINCE_LABELS[practice.province] || practice.province}</p>
                      </div>
                    </div>
                  )}
                  {practice.practiceNumber && (
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Practice Number</p>
                        <p className="font-medium">{practice.practiceNumber}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Created</p>
                      <p className="font-medium">
                        {format(new Date(practice.createdAt), "MMMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  {practice.trialEndsAt && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Trial Ends</p>
                        <p className="font-medium">
                          {format(new Date(practice.trialEndsAt), "MMMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  )}
                  {practice.practiceSize && (
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Practice Size</p>
                        <p className="font-medium capitalize">{practice.practiceSize}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Users with access to this practice
              </CardDescription>
            </CardHeader>
            <CardContent>
              {practice.User.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  No users found
                </p>
              ) : (
                <div className="divide-y dark:divide-slate-700">
                  {practice.User.map((user) => (
                    <Link
                      key={user.id}
                      href={`/admin/users/${user.id}`}
                      className="block py-4 hover:bg-slate-50 dark:hover:bg-slate-800 -mx-4 px-4 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <span className="font-medium text-slate-600 dark:text-slate-300">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {user.name}
                            </p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getRoleColor(user.role)}>
                            {user.role.replace("_", " ")}
                          </Badge>
                          {!user.isActive && (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                          {user.twoFactorEnabled && (
                            <Badge variant="outline" className="gap-1">
                              <Shield className="h-3 w-3" />
                              2FA
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
