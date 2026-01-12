"use client";

import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

const INACTIVITY_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CHECK_INTERVAL = 60 * 1000; // Check every minute
const LAST_ACTIVITY_KEY = "lastActivityTime";

export function InactivityHandler() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateLastActivity = useCallback(() => {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  }, []);

  const checkInactivity = useCallback(async () => {
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);

    if (!lastActivity) {
      // First time - set the activity time
      updateLastActivity();
      return;
    }

    const timeSinceLastActivity = Date.now() - parseInt(lastActivity, 10);

    if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
      // User has been inactive for 24 hours - sign them out
      // Reset theme to light mode before signing out
      setTheme("light");

      const supabase = createClient();
      await supabase.auth.signOut();
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      router.push("/");
    }
  }, [router, updateLastActivity, setTheme]);

  useEffect(() => {
    // Set initial activity time
    updateLastActivity();

    // Activity events to track
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    // Throttled activity handler (update at most once per minute)
    let lastUpdate = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastUpdate > 60000) {
        // Only update once per minute to reduce localStorage writes
        updateLastActivity();
        lastUpdate = now;
      }
    };

    // Add event listeners for user activity
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Check inactivity periodically
    timeoutRef.current = setInterval(checkInactivity, CHECK_INTERVAL);

    // Also check on visibility change (when tab becomes visible)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkInactivity();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
    };
  }, [updateLastActivity, checkInactivity]);

  // This component doesn't render anything
  return null;
}
