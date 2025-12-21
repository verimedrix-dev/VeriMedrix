"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useTheme } from "next-themes";

export function AdminSignOutButton() {
  const router = useRouter();
  const supabase = createClient();
  const { setTheme } = useTheme();

  const handleSignOut = async () => {
    // Reset theme to light mode before signing out
    setTheme("light");

    await supabase.auth.signOut();
    // Redirect to admin login page instead of home
    router.push("/admin-login");
    router.refresh();
  };

  return (
    <Button
      variant="ghost"
      className="w-full justify-start mt-2 text-slate-600 hover:text-slate-900 dark:!text-slate-300 dark:hover:!text-white"
      onClick={handleSignOut}
    >
      <LogOut className="h-4 w-4 mr-2" />
      Sign Out
    </Button>
  );
}
