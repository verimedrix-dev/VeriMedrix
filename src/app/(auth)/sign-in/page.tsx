"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, ShieldCheck, ArrowLeft, AlertCircle } from "lucide-react";
import { VeyroLogo } from "@/components/ui/veyro-logo";
import { toast } from "sonner";
import { check2FARequired, verify2FALogin } from "@/lib/actions/security";

function SignInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [verifying2FA, setVerifying2FA] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const supabase = createClient();

  // Check for error params in URL
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setErrorMessage(error);
      // Clear the error from URL without page reload
      router.replace("/sign-in", { scroll: false });
    }
  }, [searchParams, router]);

  // Focus first OTP input when 2FA is required
  useEffect(() => {
    if (requires2FA && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [requires2FA]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, check if user has 2FA enabled
      const twoFACheck = await check2FARequired(email);

      // Attempt to sign in with password first
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (!data.session) {
        toast.error("Sign in failed - no session returned");
        setLoading(false);
        return;
      }

      // If 2FA is enabled, show 2FA verification screen
      if (twoFACheck.required) {
        setRequires2FA(true);
        setLoading(false);
        return;
      }

      // No 2FA required, proceed to dashboard
      // Wait for session to be confirmed before redirect
      toast.success("Signed in successfully!");

      // Verify session is actually set before redirecting
      const { data: sessionCheck } = await supabase.auth.getSession();
      if (!sessionCheck.session) {
        toast.error("Session not established. Please try again.");
        setLoading(false);
        return;
      }

      // Use window.location for a full page load to ensure cookies are sent
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Sign in error:", err);
      toast.error("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otpCode];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtpCode(newOtp);
    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex((v) => !v);
    inputRefs.current[nextEmptyIndex === -1 ? 5 : nextEmptyIndex]?.focus();
  };

  const handleVerify2FA = async () => {
    const code = otpCode.join("");
    if (code.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setVerifying2FA(true);
    try {
      const result = await verify2FALogin(email, code);

      if (!result.success) {
        toast.error(result.error || "Invalid code");
        setOtpCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        setVerifying2FA(false);
        return;
      }

      toast.success("Signed in successfully!");

      // Verify session is actually set before redirecting
      const { data: sessionCheck } = await supabase.auth.getSession();
      if (!sessionCheck.session) {
        toast.error("Session not established. Please try again.");
        setVerifying2FA(false);
        return;
      }

      // Use window.location for a full page load to ensure cookies are sent
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("2FA verification error:", err);
      toast.error("Verification failed");
      setVerifying2FA(false);
    }
  };

  const handleBack = async () => {
    // Sign out and go back to password entry
    await supabase.auth.signOut();
    setRequires2FA(false);
    setOtpCode(["", "", "", "", "", ""]);
    setPassword("");
  };

  // 2FA Verification Screen
  if (requires2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Two-Factor Authentication</CardTitle>
            <CardDescription>
              Enter the 6-digit code from your authenticator app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center gap-2">
              {otpCode.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={index === 0 ? handleOtpPaste : undefined}
                  className="w-12 h-12 text-center text-xl font-semibold"
                  disabled={verifying2FA}
                />
              ))}
            </div>
            <p className="text-sm text-center text-slate-500">
              You can also use a backup code if you don&apos;t have access to your authenticator app
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button
              onClick={handleVerify2FA}
              className="w-full"
              disabled={verifying2FA || otpCode.join("").length !== 6}
            >
              {verifying2FA && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify
            </Button>
            <Button
              variant="ghost"
              onClick={handleBack}
              className="w-full text-slate-600"
              disabled={verifying2FA}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Regular Sign In Screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <VeyroLogo className="h-10 w-10 text-slate-800" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your VeriMedrix account
          </CardDescription>
        </CardHeader>
        {errorMessage && (
          <div className="px-6">
            <Alert variant="destructive" className="mb-0">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          </div>
        )}
        <form onSubmit={handleSignIn}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
            <p className="text-sm text-center text-slate-600">
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="text-blue-600 hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </CardContent>
        </Card>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
