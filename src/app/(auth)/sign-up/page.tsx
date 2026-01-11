"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { VeyroLogo } from "@/components/ui/veyro-logo";
import { toast } from "sonner";
import { checkEmailExists } from "@/lib/actions/auth";

function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Store the selected plan in localStorage when coming from landing page
  useEffect(() => {
    const plan = searchParams.get("plan");
    if (plan === "ESSENTIALS" || plan === "PROFESSIONAL") {
      localStorage.setItem("selectedPlan", plan);
    }
  }, [searchParams]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Password validation: at least 6 letters, 1 number, and 1 symbol
    const letterCount = (password.match(/[a-zA-Z]/g) || []).length;
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password);

    if (letterCount < 6) {
      toast.error("Password must contain at least 6 letters");
      return;
    }

    if (!hasNumber) {
      toast.error("Password must contain at least 1 number");
      return;
    }

    if (!hasSymbol) {
      toast.error("Password must contain at least 1 symbol (e.g., !@#$%^&*)");
      return;
    }

    setLoading(true);

    try {
      // Check if email already exists in our system
      const { exists, isEmployee, hasUsedTrial } = await checkEmailExists(email);

      if (exists) {
        toast.error("This email address has already been taken. Please sign in or use a different email.");
        setLoading(false);
        return;
      }

      if (isEmployee) {
        toast.error("This email is registered as an employee. Please check your email for an invitation link, or contact your practice administrator.");
        setLoading(false);
        return;
      }

      if (hasUsedTrial) {
        toast.error("This email address has already been taken for a free trial. Please use a different email or contact support.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      // Check if user already existed in Supabase (repeated signup)
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        toast.error("This email address has already been taken. Please sign in or use a different email.");
        return;
      }

      // Redirect to check-email page with the email address
      router.push(`/check-email?email=${encodeURIComponent(email)}`);
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <VeyroLogo className="h-10 w-10 text-slate-800" />
          </div>
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Start your 14-day free trial of VeriMedrix
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignUp}>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <p className="text-xs text-slate-500">
              Password must contain at least 6 letters, 1 number, and 1 symbol (e.g., !@#$%^&*)
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-6">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
            <p className="text-sm text-center text-slate-600">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-blue-600 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <VeyroLogo className="h-10 w-10 text-slate-800" />
            </div>
            <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
            <CardDescription>
              Start your 14-day free trial of VeriMedrix
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </CardContent>
        </Card>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  );
}
