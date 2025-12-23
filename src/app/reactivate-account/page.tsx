"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { reactivatePracticeAccount } from "@/lib/actions/practice";
import Link from "next/link";

function ReactivateAccountContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "reactivating" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const practiceId = searchParams.get("practiceId");
  const email = searchParams.get("email");

  useEffect(() => {
    if (!practiceId || !email) {
      setStatus("error");
      setError("Invalid reactivation link. Please use the link from your email.");
    } else {
      setStatus("ready");
    }
  }, [practiceId, email]);

  const handleReactivate = async () => {
    if (!practiceId || !email) return;

    setStatus("reactivating");
    setError(null);

    try {
      await reactivatePracticeAccount(practiceId, email);
      setStatus("success");
      // Redirect to sign-in after 3 seconds
      setTimeout(() => {
        router.push("/sign-in");
      }, 3000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to reactivate account");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <RefreshCw className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Reactivate Your Account</CardTitle>
          <CardDescription>
            Your account is scheduled for deletion. You can restore it now.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "loading" && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          )}

          {status === "ready" && (
            <>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Important:</strong> Clicking the button below will restore your account and all your data.
                  Your subscription will be reactivated.
                </p>
              </div>
              <Button
                onClick={handleReactivate}
                className="w-full"
                size="lg"
              >
                Reactivate My Account
              </Button>
              <p className="text-center text-sm text-slate-500">
                Changed your mind?{" "}
                <Link href="/" className="text-blue-600 hover:underline">
                  Return to homepage
                </Link>
              </p>
            </>
          )}

          {status === "reactivating" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-slate-600 dark:text-slate-400">Reactivating your account...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
                  Account Reactivated!
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Your account has been restored. Redirecting to sign in...
                </p>
              </div>
              <Button asChild className="mt-4">
                <Link href="/sign-in">Sign In Now</Link>
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
                  Reactivation Failed
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {error}
                </p>
              </div>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" asChild>
                  <Link href="/">Go to Homepage</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="mailto:support@ohscapp.co.za">Contact Support</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReactivateAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      }
    >
      <ReactivateAccountContent />
    </Suspense>
  );
}
