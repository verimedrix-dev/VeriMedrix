"use client";

import { useState } from "react";
import { useRefresh } from "@/hooks/use-refresh";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, LogIn, LogOut, Loader2, Coffee } from "lucide-react";
import { toast } from "sonner";
import { clockInSelf, clockOutSelf } from "@/lib/actions/locums";
import { differenceInMinutes, format } from "date-fns";

interface ClockInOutButtonsProps {
  isClockedIn: boolean;
  clockInTime: Date | null;
}

export function ClockInOutButtons({ isClockedIn, clockInTime }: ClockInOutButtonsProps) {
  const { refresh } = useRefresh();
  const [loading, setLoading] = useState(false);
  const [showBreakDialog, setShowBreakDialog] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState(0);

  const handleClockIn = async () => {
    setLoading(true);
    try {
      await clockInSelf();
      toast.success("Clocked in successfully");
      refresh();
    } catch (error) {
      console.error("Clock in error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to clock in");
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      await clockOutSelf(breakMinutes);
      toast.success("Clocked out successfully");
      setShowBreakDialog(false);
      setBreakMinutes(0);
      refresh();
    } catch (error) {
      console.error("Clock out error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to clock out");
    } finally {
      setLoading(false);
    }
  };

  // Calculate time worked so far
  const minutesWorked = clockInTime ? differenceInMinutes(new Date(), clockInTime) : 0;
  const hoursWorked = Math.floor(minutesWorked / 60);
  const minsRemaining = minutesWorked % 60;

  return (
    <>
      <div className="space-y-4">
        {isClockedIn && clockInTime && (
          <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg border">
            <p className="text-sm text-slate-500 mb-1">Time worked so far</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {hoursWorked}h {minsRemaining}m
            </p>
          </div>
        )}

        {isClockedIn ? (
          <Button
            onClick={() => setShowBreakDialog(true)}
            disabled={loading}
            className="w-full h-16 text-lg bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <LogOut className="h-6 w-6 mr-3" />
                Clock Out
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleClockIn}
            disabled={loading}
            className="w-full h-16 text-lg bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <LogIn className="h-6 w-6 mr-3" />
                Clock In
              </>
            )}
          </Button>
        )}
      </div>

      {/* Break Time Dialog */}
      <Dialog open={showBreakDialog} onOpenChange={setShowBreakDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5" />
              Clock Out
            </DialogTitle>
            <DialogDescription>
              Did you take any breaks during your shift?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="break">Break Time (minutes)</Label>
              <Input
                id="break"
                type="number"
                min="0"
                max="480"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-xs text-slate-500">
                Enter the total break time in minutes (e.g., 30 for a 30-minute lunch break)
              </p>
            </div>

            {clockInTime && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-500">Shift Summary</p>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Clock In:</span>
                    <span className="font-medium">{format(clockInTime, "HH:mm")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Clock Out:</span>
                    <span className="font-medium">{format(new Date(), "HH:mm")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Break:</span>
                    <span className="font-medium">{breakMinutes} min</span>
                  </div>
                  <div className="border-t pt-1 mt-1 flex justify-between font-medium">
                    <span>Working Hours:</span>
                    <span>
                      {((minutesWorked - breakMinutes) / 60).toFixed(2)}h
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBreakDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleClockOut}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              Confirm Clock Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
