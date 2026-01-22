"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle2, Building2 } from "lucide-react";
import { VeyroLogo } from "@/components/ui/veyro-logo";
import { toast } from "sonner";
import { validateInvitation, acceptInvitation, createInvitedUser } from "@/lib/actions/team";
import { getAccessLevelDisplayName } from "@/lib/permissions";
import { UserRole } from "@prisma/client";

interface InvitationData {
  id: string;
  email: string;
  role: UserRole;
  isLocum: boolean;
  employee: {
    id: string;
    fullName: string;
    position: string;
  } | null;
  person: {
    fullName: string;
    position: string;
  } | null;
  practice: {
    id: string;
    name: string;
  };
}

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    async function checkInvitation() {
      if (!token) {
        setError("No invitation token provided");
        setLoading(false);
        return;
      }

      try {
        const result = await validateInvitation(token);
        if (!result.valid) {
          setError(result.error || "Invalid invitation");
        } else if (result.invitation) {
          setInvitation(result.invitation);
        }
      } catch (err) {
        console.error("Error validating invitation:", err);
        setError("Failed to validate invitation");
      } finally {
        setLoading(false);
      }
    }

    checkInvitation();
  }, [token]);

  const handleAcceptInvitation = async (e: React.FormEvent) => {
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

    if (!token || !invitation) {
      toast.error("Invalid invitation");
      return;
    }

    setSubmitting(true);

    try {
      // Create Supabase auth account with email auto-confirmed (server-side)
      const { userId } = await createInvitedUser(invitation.email, password);

      // Accept the invitation and create the user in database
      await acceptInvitation(token, userId);

      toast.success("Account created successfully! You can now sign in.");

      // Redirect to sign-in page
      router.push("/sign-in");
    } catch (err) {
      console.error("Error accepting invitation:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to accept invitation. Please try again.";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-slate-600">Validating invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-xl">Invalid Invitation</CardTitle>
            <CardDescription className="text-red-600">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-slate-600 mb-4">
              This invitation link may have expired or already been used.
              Please contact your administrator for a new invitation.
            </p>
          </CardContent>
          <CardFooter className="justify-center">
            <Link href="/sign-in">
              <Button variant="outline">Go to Sign In</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <VeyroLogo className="h-10 w-10 text-slate-800" />
          </div>
          <CardTitle className="text-2xl font-bold">Accept Invitation</CardTitle>
          <CardDescription>
            Create your account to join {invitation.practice.name}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Invitation Details */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">{invitation.practice.name}</p>
                <p className="text-sm text-slate-600">{invitation.person?.position || ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-slate-600">
                Access Level: <strong className="text-slate-900">{getAccessLevelDisplayName(invitation.role)}</strong>
              </span>
            </div>
          </div>

          <form onSubmit={handleAcceptInvitation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invitation.email}
                disabled
                className="bg-slate-50"
              />
              <p className="text-xs text-slate-500">
                This is the email associated with your employee record
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={invitation.person?.fullName || ""}
                disabled
                className="bg-slate-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-slate-500">
                Password must contain at least 6 letters, 1 number, and 1 symbol
              </p>
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

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account & Join Team
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <p className="text-xs text-center text-slate-500">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
          <p className="text-sm text-center text-slate-600">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-slate-600">Loading...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AcceptInvitationContent />
    </Suspense>
  );
}
