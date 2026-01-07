"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Building2, Check, ChevronDown, Crown, Loader2, Plus, User } from "lucide-react";
import { switchPractice } from "@/lib/actions/practice";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Practice {
  id: string;
  name: string;
  role: string;
  isOwner: boolean;
  isCurrent: boolean;
}

interface PracticeSwitcherProps {
  practices: Practice[];
  currentPracticeName: string;
}

export function PracticeSwitcher({ practices, currentPracticeName }: PracticeSwitcherProps) {
  const router = useRouter();
  const [switching, setSwitching] = useState<string | null>(null);

  // Don't show switcher if user only has one practice
  if (practices.length <= 1) {
    return null;
  }

  const handleSwitchPractice = async (practiceId: string) => {
    setSwitching(practiceId);
    try {
      await switchPractice(practiceId);
      router.refresh();
      toast.success("Switched practice successfully");
    } catch (error) {
      console.error("Failed to switch practice:", error);
      toast.error("Failed to switch practice");
    } finally {
      setSwitching(null);
    }
  };

  const getRoleIcon = (role: string, isOwner: boolean) => {
    if (isOwner || role === "PRACTICE_OWNER") {
      return <Crown className="h-3 w-3 text-amber-500" />;
    }
    return <User className="h-3 w-3 text-slate-400" />;
  };

  return (
    <div className="px-4 py-2 border-b">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between h-auto py-2 px-3 font-normal"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="h-4 w-4 text-slate-500 flex-shrink-0" />
              <span className="truncate text-sm">{currentPracticeName}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Switch Practice</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {practices.map((practice) => (
            <DropdownMenuItem
              key={practice.id}
              onClick={() => !practice.isCurrent && handleSwitchPractice(practice.id)}
              disabled={switching !== null}
              className={cn(
                "cursor-pointer",
                practice.isCurrent && "bg-slate-50 dark:bg-slate-800"
              )}
            >
              <div className="flex items-center gap-3 w-full">
                <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{practice.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {getRoleIcon(practice.role, practice.isOwner)}
                    <span className="text-xs text-slate-500">
                      {practice.isOwner ? "Owner" : practice.role === "ADMIN" ? "Full Access" : practice.role}
                    </span>
                  </div>
                </div>
                {switching === practice.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                ) : practice.isCurrent ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : null}
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => router.push("/dashboard")}
            className="cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2 text-slate-400" />
            <span className="text-sm">Create New Practice</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
