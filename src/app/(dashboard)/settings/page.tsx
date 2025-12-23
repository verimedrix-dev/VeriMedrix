import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building,
  Bell,
  Users,
  CreditCard,
  Shield,
  FileText,
} from "lucide-react";
import { getPracticeSettings, getPracticeDocuments, getSubscriptionInfo } from "@/lib/actions/practice";
import { PracticeSettingsForm } from "@/components/settings/practice-settings-form";
import { PracticeDocuments } from "@/components/settings/practice-documents";
import { BillingSection } from "@/components/settings/billing-section";
import { SecuritySettings } from "@/components/settings/security-settings";
import { TeamSettings } from "@/components/settings/team-settings";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default async function SettingsPage() {
  // Only practice owners can access the settings page
  await requirePermission(PERMISSIONS.SETTINGS);

  const practice = await getPracticeSettings();
  const documents = await getPracticeDocuments();
  const subscription = await getSubscriptionInfo();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Manage your practice settings and preferences
        </p>
      </div>

      <Tabs defaultValue="practice" className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full max-w-3xl">
          <TabsTrigger value="practice" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Practice
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Practice Settings */}
        <TabsContent value="practice">
          {practice ? (
            <PracticeSettingsForm practice={practice} />
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-slate-500">
                  Unable to load practice settings. Please try again.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents">
          <PracticeDocuments documents={documents} />
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        {/* Team Settings */}
        <TabsContent value="team">
          <TeamSettings />
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing">
          <BillingSection currentTier={subscription?.subscriptionTier || "ESSENTIALS"} />
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <SecuritySettings practiceName={practice?.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
