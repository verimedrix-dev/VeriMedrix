"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChangePasswordDialog } from "./security/change-password-dialog";
import { ActiveSessionsDialog } from "./security/active-sessions-dialog";
import { TwoFactorDialog } from "./security/two-factor-dialog";

export function SecuritySettings() {
  return (
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
  );
}
