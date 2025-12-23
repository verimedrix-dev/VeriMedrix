"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChangePasswordDialog } from "./security/change-password-dialog";
import { ActiveSessionsDialog } from "./security/active-sessions-dialog";
import { TwoFactorDialog } from "./security/two-factor-dialog";
import { DeleteAccountDialog } from "./delete-account-dialog";

interface SecuritySettingsProps {
  practiceName?: string;
}

export function SecuritySettings({ practiceName }: SecuritySettingsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>
            Manage your account security and access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium dark:text-white">Two-Factor Authentication</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Add an extra layer of security to your account
              </p>
            </div>
            <TwoFactorDialog />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium dark:text-white">Change Password</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Update your account password
              </p>
            </div>
            <ChangePasswordDialog />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium dark:text-white">Active Sessions</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Manage devices where you&apos;re logged in
              </p>
            </div>
            <ActiveSessionsDialog />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {practiceName && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
              <div>
                <p className="font-medium text-red-700 dark:text-red-400">Delete Practice Account</p>
                <p className="text-sm text-red-600/80 dark:text-red-400/80">
                  Permanently delete your practice and all its data. Your subscription will be cancelled immediately.
                </p>
              </div>
              <DeleteAccountDialog practiceName={practiceName} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
