"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Monitor, Smartphone, Globe, LogOut } from "lucide-react";
import { getActiveSessions, signOutAllDevices } from "@/lib/actions/security";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

type Session = {
  id: string;
  device: string;
  lastActive: string;
  isCurrent: boolean;
};

export function ActiveSessionsDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      loadSessions();
    }
  }, [open]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const result = await getActiveSessions();
      if (result.sessions) {
        setSessions(result.sessions);
      }
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOutAll = async () => {
    setIsSigningOut(true);
    try {
      const result = await signOutAllDevices();
      if (result.success) {
        toast.success("Signed out from all devices");
        setOpen(false);
        router.push("/");
      } else {
        toast.error(result.error || "Failed to sign out");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSigningOut(false);
    }
  };

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes("mobile") || device.toLowerCase().includes("phone")) {
      return <Smartphone className="h-5 w-5" />;
    }
    if (device.toLowerCase().includes("browser") || device.toLowerCase().includes("web")) {
      return <Globe className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">View Sessions</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Active Sessions
          </DialogTitle>
          <DialogDescription>
            Devices where your account is currently signed in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No active sessions found
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-slate-700 rounded-lg">
                      {getDeviceIcon(session.device)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium dark:text-white">{session.device}</p>
                        {session.isCurrent && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Last active: {new Date(session.lastActive).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-600 dark:text-red-400">Sign out everywhere</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  This will sign you out from all devices
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleSignOutAll}
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                Sign Out All
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
