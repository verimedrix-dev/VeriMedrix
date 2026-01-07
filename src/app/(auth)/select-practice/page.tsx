"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VeyroLogo } from "@/components/ui/veyro-logo";
import { Building2, ChevronRight, Loader2, Crown, User } from "lucide-react";
import { getUserPractices, switchPractice } from "@/lib/actions/practice";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Practice {
  id: string;
  name: string;
  email: string;
  role: string;
  isOwner: boolean;
  isCurrent: boolean;
  subscriptionTier: string;
}

export default function SelectPracticePage() {
  const router = useRouter();
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    async function loadPractices() {
      try {
        const data = await getUserPractices();
        setPractices(data);

        // If only one practice, auto-select it
        if (data.length === 1) {
          handleSelectPractice(data[0].id);
        } else if (data.length === 0) {
          // No practices - redirect to dashboard to trigger practice creation
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Failed to load practices:", error);
        toast.error("Failed to load your practices");
        router.push("/sign-in");
      } finally {
        setLoading(false);
      }
    }

    loadPractices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectPractice = async (practiceId: string) => {
    setSelecting(practiceId);
    try {
      await switchPractice(practiceId);
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to select practice:", error);
      toast.error("Failed to select practice");
      setSelecting(null);
    }
  };

  const getRoleDisplay = (role: string, isOwner: boolean) => {
    if (isOwner) return "Owner";
    switch (role) {
      case "PRACTICE_OWNER":
        return "Owner";
      case "ADMIN":
        return "Full Access";
      case "STAFF":
        return "Staff";
      case "VIEWER":
        return "View Only";
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          <p className="text-slate-500">Loading your practices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <VeyroLogo className="h-10 w-10 text-slate-800" />
          </div>
          <CardTitle className="text-2xl font-bold">Select a Practice</CardTitle>
          <CardDescription>
            You have access to multiple practices. Choose one to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {practices.map((practice) => (
            <button
              key={practice.id}
              onClick={() => handleSelectPractice(practice.id)}
              disabled={selecting !== null}
              className={cn(
                "w-full p-4 rounded-lg border transition-all text-left",
                "hover:border-slate-400 hover:bg-slate-50",
                "focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                practice.isCurrent && "border-green-500 bg-green-50"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-slate-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 truncate">
                      {practice.name}
                    </p>
                    {practice.isCurrent && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {practice.isOwner ? (
                      <Crown className="h-3.5 w-3.5 text-amber-500" />
                    ) : (
                      <User className="h-3.5 w-3.5 text-slate-400" />
                    )}
                    <span className="text-sm text-slate-500">
                      {getRoleDisplay(practice.role, practice.isOwner)}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-sm text-slate-400 capitalize">
                      {practice.subscriptionTier.toLowerCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {selecting === practice.id ? (
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </div>
            </button>
          ))}

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/dashboard")}
              disabled={selecting !== null}
            >
              Create New Practice
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
