"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { VeyroLogo } from "@/components/ui/veyro-logo";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      // Use auth callback route which handles the recovery token
      const redirectUrl = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error("Password reset error:", error);
        if (error.message.includes("rate limit")) {
          toast.error("Too many attempts. Please try again later.");
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }

      setEmailSent(true);
    } catch (err) {
      console.error("Password reset error:", err);
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        toast.error("Network error. Please check your internet connection and try again.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Success screen after email is sent
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
            <CardDescription>
              We&apos;ve sent a password reset link to <span className="font-medium text-slate-700">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500 text-center">
              Click the link in the email to reset your password. If you don&apos;t see the email, check your spam folder.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button
              variant="outline"
              onClick={() => setEmailSent(false)}
              className="w-full"
            >
              <Mail className="mr-2 h-4 w-4" />
              Try a different email
            </Button>
            <Link href="/sign-in" className="w-full">
              <Button variant="ghost" className="w-full text-slate-600">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to sign in
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Request password reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <VeyroLogo className="h-10 w-10 text-slate-800" />
          </div>
          <CardTitle className="text-2xl font-bold">Forgot password?</CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
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
                autoFocus
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send reset link
            </Button>
            <Link href="/sign-in" className="w-full">
              <Button variant="ghost" className="w-full text-slate-600">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to sign in
              </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
