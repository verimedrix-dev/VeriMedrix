"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, Bell, FileWarning, CheckSquare, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import {
  getNotificationPreferences,
  updateNotificationPreference,
  type NotificationPreferences,
} from "@/lib/actions/notifications";

type PreferenceKey = keyof NotificationPreferences;

interface NotificationItemProps {
  title: string;
  description: string;
  preferenceKey: PreferenceKey;
  enabled: boolean;
  onToggle: (key: PreferenceKey, value: boolean) => void;
  isLoading: boolean;
}

function NotificationItem({
  title,
  description,
  preferenceKey,
  enabled,
  onToggle,
  isLoading,
}: NotificationItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <p className="font-medium dark:text-white">{title}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={(checked) => onToggle(preferenceKey, checked)}
        disabled={isLoading}
      />
    </div>
  );
}

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState<PreferenceKey | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setIsLoading(true);
    try {
      const prefs = await getNotificationPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error("Failed to load preferences:", error);
      toast.error("Failed to load notification preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (key: PreferenceKey, value: boolean) => {
    if (!preferences) return;

    // Optimistic update
    setPreferences((prev) => (prev ? { ...prev, [key]: value } : null));
    setUpdatingKey(key);

    try {
      const result = await updateNotificationPreference(key, value);
      if (!result.success) {
        // Revert on error
        setPreferences((prev) => (prev ? { ...prev, [key]: !value } : null));
        toast.error(result.error || "Failed to update preference");
      } else {
        toast.success("Preference updated");
      }
    } catch (error) {
      // Revert on error
      setPreferences((prev) => (prev ? { ...prev, [key]: !value } : null));
      toast.error("Failed to update preference");
    } finally {
      setUpdatingKey(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            <span className="ml-2 text-slate-500">Loading notification preferences...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-slate-500">
            Unable to load notification preferences. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Document Expiry Reminders */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-amber-500" />
            <CardTitle>Document Expiry Reminders</CardTitle>
          </div>
          <CardDescription>
            Get notified before your documents and certificates expire
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <NotificationItem
            title="90 days before expiry"
            description="Early warning for major renewals and certifications"
            preferenceKey="notifyExpiry90Days"
            enabled={preferences.notifyExpiry90Days}
            onToggle={handleToggle}
            isLoading={updatingKey === "notifyExpiry90Days"}
          />
          <Separator />
          <NotificationItem
            title="60 days before expiry"
            description="Time to start the renewal process"
            preferenceKey="notifyExpiry60Days"
            enabled={preferences.notifyExpiry60Days}
            onToggle={handleToggle}
            isLoading={updatingKey === "notifyExpiry60Days"}
          />
          <Separator />
          <NotificationItem
            title="30 days before expiry"
            description="Urgent reminder to complete renewals"
            preferenceKey="notifyExpiry30Days"
            enabled={preferences.notifyExpiry30Days}
            onToggle={handleToggle}
            isLoading={updatingKey === "notifyExpiry30Days"}
          />
          <Separator />
          <NotificationItem
            title="Critical reminders (14, 7, 0 days)"
            description="Final warnings before documents expire"
            preferenceKey="notifyExpiryCritical"
            enabled={preferences.notifyExpiryCritical}
            onToggle={handleToggle}
            isLoading={updatingKey === "notifyExpiryCritical"}
          />
        </CardContent>
      </Card>

      {/* Task Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-blue-500" />
            <CardTitle>Task Notifications</CardTitle>
          </div>
          <CardDescription>
            Stay updated on task assignments and deadlines
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <NotificationItem
            title="Task Assignment"
            description="Get notified when a task is assigned to you"
            preferenceKey="notifyTaskAssignment"
            enabled={preferences.notifyTaskAssignment}
            onToggle={handleToggle}
            isLoading={updatingKey === "notifyTaskAssignment"}
          />
          <Separator />
          <NotificationItem
            title="Overdue Tasks"
            description="Get notified when your tasks become overdue"
            preferenceKey="notifyTaskOverdue"
            enabled={preferences.notifyTaskOverdue}
            onToggle={handleToggle}
            isLoading={updatingKey === "notifyTaskOverdue"}
          />
        </CardContent>
      </Card>

      {/* Summary & Digest */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-green-500" />
            <CardTitle>Weekly Digest</CardTitle>
          </div>
          <CardDescription>
            Receive a weekly summary of your compliance status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationItem
            title="Weekly Compliance Digest"
            description="A summary of upcoming expirations, pending tasks, and compliance status sent every Monday"
            preferenceKey="notifyWeeklyDigest"
            enabled={preferences.notifyWeeklyDigest}
            onToggle={handleToggle}
            isLoading={updatingKey === "notifyWeeklyDigest"}
          />
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-slate-500 mt-0.5" />
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <p className="font-medium text-slate-700 dark:text-slate-300">About Email Notifications</p>
              <p className="mt-1">
                All notifications are sent to your registered email address ({preferences ? "enabled" : "loading"}).
                Make sure your email is up to date in your profile settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
