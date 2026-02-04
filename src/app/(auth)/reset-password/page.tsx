"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, EyeOff, KeyRound, CheckCircle, XCircle } from "lucide-react";
import { VeyroLogo } from "@/components/ui/veyro-logo";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const supabase = createClient();

  // Check if user has a valid session (from the email link)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError("Invalid or expired reset link. Please request a new password reset.");
      }

      setCheckingSession(false);
    };

    checkSession();
  }, [supabase.auth]);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(pwd)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(pwd)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast.success("Password updated successfully!");

      // Sign out so they can sign in with new password
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Password update error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Loading state while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state - invalid or expired link
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Link expired</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col space-y-3">
            <Link href="/forgot-password" className="w-full">
              <Button className="w-full">
                Request new link
              </Button>
            </Link>
            <Link href="/sign-in" className="w-full">
              <Button variant="ghost" className="w-full text-slate-600">
                Back to sign in
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Success state - password was reset
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Password updated!</CardTitle>
            <CardDescription>
              Your password has been successfully reset. You can now sign in with your new password.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/sign-in" className="w-full">
              <Button className="w-full">
                Sign in
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <VeyroLogo className="h-10 w-10 text-slate-800" />
          </div>
          <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
          <CardDescription>
            Enter a new password for your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                  autoFocus
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
              <p className="text-xs text-slate-500">
                At least 8 characters with uppercase, lowercase, and a number
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? (
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
              <KeyRound className="mr-2 h-4 w-4" />
              Reset password
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
