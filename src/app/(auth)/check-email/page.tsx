"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const COOLDOWN_SECONDS = 60;

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const supabase = createClient();

  // Load cooldown from localStorage on mount
  useEffect(() => {
    if (email) {
      const storedCooldown = localStorage.getItem(`resend_cooldown_${email}`);
      if (storedCooldown) {
        const remainingTime = Math.max(0, parseInt(storedCooldown) - Date.now());
        if (remainingTime > 0) {
          setCooldown(Math.ceil(remainingTime / 1000));
        }
      }
    }
  }, [email]);

  // Countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleResendEmail = async () => {
    if (!email || cooldown > 0) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      // Set cooldown
      const cooldownUntil = Date.now() + COOLDOWN_SECONDS * 1000;
      localStorage.setItem(`resend_cooldown_${email}`, cooldownUntil.toString());
      setCooldown(COOLDOWN_SECONDS);

      toast.success("Confirmation email sent! Please check your inbox.");
    } catch {
      toast.error("Failed to resend confirmation email");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-4">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription className="text-base">
            We&apos;ve sent a confirmation link to{" "}
            {email ? (
              <span className="font-medium text-slate-900">{email}</span>
            ) : (
              "your email address"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-slate-50 border p-4 space-y-2">
            <p className="text-sm text-slate-600">
              Click the link in your email to verify your account and get started with VeriMedrix.
            </p>
            <p className="text-sm text-slate-500">
              The link will expire in 24 hours.
            </p>
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <p className="text-sm text-amber-800">
              <strong>Can&apos;t find the email?</strong> Check your spam or junk folder.
              The email is from <span className="font-medium">noreply@verimedrix.co.za</span>
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResendEmail}
            disabled={!email || isResending || cooldown > 0}
          >
            {isResending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {cooldown > 0
              ? `Resend in ${cooldown}s`
              : isResending
              ? "Sending..."
              : "Resend confirmation email"}
          </Button>
          <Button variant="ghost" className="w-full" asChild>
            <Link href="/sign-in">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to sign in
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors">
          <span className="text-sm font-medium">VeriMedrix</span>
        </Link>
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      <CheckEmailContent />
    </Suspense>
  );
}
