"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, LogIn, LogOut, Building, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { clockIn, clockOut } from "@/lib/actions/locums";
import { LocumSourceType } from "@prisma/client";
import { format, differenceInMinutes } from "date-fns";

interface ClockInOutCardProps {
  locum: {
    id: string;
    fullName: string;
    hourlyRate: number;
    sourceType: LocumSourceType;
    agencyName: string | null;
  };
  currentTimesheet: {
    id: string;
    clockIn: Date | null;
  } | null;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ClockInOutCard({ locum, currentTimesheet }: ClockInOutCardProps) {
  const [loading, setLoading] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(!!currentTimesheet?.clockIn);
  const [clockInTime, setClockInTime] = useState<Date | null>(
    currentTimesheet?.clockIn ? new Date(currentTimesheet.clockIn) : null
  );
  const [elapsedTime, setElapsedTime] = useState("");
  const [showClockDialog, setShowClockDialog] = useState(false);
  const [showClockOutDialog, setShowClockOutDialog] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState(0);

  // Update elapsed time every minute
  useEffect(() => {
    if (!isClockedIn || !clockInTime) return;

    const updateElapsed = () => {
      const mins = differenceInMinutes(new Date(), clockInTime);
      const hours = Math.floor(mins / 60);
      const minutes = mins % 60;
      setElapsedTime(`${hours}h ${minutes}m`);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 60000);
    return () => clearInterval(interval);
  }, [isClockedIn, clockInTime]);

  const handleClockIn = async () => {
    setLoading(true);
    try {
      const result = await clockIn(locum.id);
      setIsClockedIn(true);
      setClockInTime(new Date(result.clockIn!));
      setShowClockDialog(false);
      toast.success(`${locum.fullName} clocked in at ${format(new Date(), "HH:mm")}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to clock in");
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      const result = await clockOut(locum.id, breakMinutes);
      setIsClockedIn(false);
      setClockInTime(null);
      setShowClockOutDialog(false);
      setBreakMinutes(0);
      toast.success(
        `${locum.fullName} clocked out. Hours: ${result.hoursWorked?.toFixed(2)}h, Total: R${result.totalPayable?.toFixed(2)}`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to clock out");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className={isClockedIn ? "border-green-500 dark:border-green-600" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100 font-medium">
                {getInitials(locum.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-lg">{locum.fullName}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                {locum.sourceType === "AGENCY" ? (
                  <>
                    <Building className="h-3 w-3" />
                    {locum.agencyName || "Agency"}
                  </>
                ) : (
                  "Direct Hire"
                )}
                <span>•</span>
                <span>R{locum.hourlyRate}/hr</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isClockedIn ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <Clock className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Working</p>
                    <p className="text-sm">
                      Since {clockInTime ? format(clockInTime, "HH:mm") : "--:--"}
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-lg px-3 py-1">
                  {elapsedTime || "0h 0m"}
                </Badge>
              </div>
              <Button
                onClick={() => setShowClockDialog(true)}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                <Clock className="h-4 w-4 mr-2" />
                Clock In / Out
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setShowClockDialog(true)}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              <Clock className="h-4 w-4 mr-2" />
              Clock In / Out
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Clock In/Out Selection Dialog */}
      <Dialog open={showClockDialog} onOpenChange={setShowClockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clock In / Out - {locum.fullName}</DialogTitle>
            <DialogDescription>
              Select an action for this locum.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button
              onClick={handleClockIn}
              className="w-full h-14 bg-green-600 hover:bg-green-700 text-lg"
              disabled={loading || isClockedIn}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <LogIn className="h-5 w-5 mr-2" />
              )}
              Clock In
            </Button>
            <Button
              onClick={() => {
                setShowClockDialog(false);
                setShowClockOutDialog(true);
              }}
              className="w-full h-14 bg-red-600 hover:bg-red-700 text-lg"
              disabled={loading || !isClockedIn}
            >
              <LogOut className="h-5 w-5 mr-2" />
              Clock Out
            </Button>
            {isClockedIn && (
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                Currently clocked in since {clockInTime ? format(clockInTime, "HH:mm") : "--:--"}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Clock Out Dialog */}
      <Dialog open={showClockOutDialog} onOpenChange={setShowClockOutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clock Out - {locum.fullName}</DialogTitle>
            <DialogDescription>
              Enter break time if applicable. This will be deducted from total hours.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <span className="text-sm text-slate-600 dark:text-slate-400">Time worked</span>
              <span className="font-medium">{elapsedTime}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="breakMinutes">Break time (minutes)</Label>
              <Input
                id="breakMinutes"
                type="number"
                min="0"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-xs text-slate-500">
                Common: 30 min lunch, 60 min lunch
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowClockOutDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleClockOut}
                className="bg-red-600 hover:bg-red-700"
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm Clock Out
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
