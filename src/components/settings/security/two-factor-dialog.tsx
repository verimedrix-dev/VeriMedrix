"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Shield, ShieldCheck, ShieldOff, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  get2FAStatus,
  setup2FA,
  verify2FASetup,
  disable2FA,
} from "@/lib/actions/security";
import { useRefresh } from "@/hooks/use-refresh";
import Image from "next/image";

type SetupStep = "initial" | "qr" | "verify" | "backup" | "complete";

export function TwoFactorDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [step, setStep] = useState<SetupStep>("initial");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const { refresh } = useRefresh();

  useEffect(() => {
    if (open) {
      loadStatus();
    }
  }, [open]);

  const loadStatus = async () => {
    const result = await get2FAStatus();
    setIsEnabled(result.enabled);
    setStep("initial");
    setVerificationCode("");
    setDisableCode("");
  };

  const handleSetup = async () => {
    setIsLoading(true);
    try {
      const result = await setup2FA();
      if (result.success && result.qrCode && result.secret && result.backupCodes) {
        setQrCode(result.qrCode);
        setSecret(result.secret);
        setBackupCodes(result.backupCodes);
        setStep("qr");
      } else {
        toast.error(result.error || "Failed to setup 2FA");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      const result = await verify2FASetup(verificationCode);
      if (result.success) {
        setStep("backup");
        toast.success("2FA verified successfully");
      } else {
        toast.error(result.error || "Invalid code");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    if (disableCode.length < 6) {
      toast.error("Please enter your verification code");
      return;
    }

    setIsLoading(true);
    try {
      const result = await disable2FA(disableCode);
      if (result.success) {
        toast.success("Two-factor authentication disabled");
        setIsEnabled(false);
        setStep("initial");
        setDisableCode("");
        refresh();
      } else {
        toast.error(result.error || "Invalid code");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    setOpen(false);
    setIsEnabled(true);
    setStep("initial");
    refresh();
  };

  const copyToClipboard = async (text: string, type: "secret" | "backup") => {
    await navigator.clipboard.writeText(text);
    if (type === "secret") {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2000);
    }
    toast.success("Copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          {isEnabled ? "Manage" : "Enable"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEnabled ? (
              <ShieldCheck className="h-5 w-5 text-green-600" />
            ) : (
              <Shield className="h-5 w-5" />
            )}
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            {isEnabled
              ? "Your account is protected with 2FA"
              : "Add an extra layer of security to your account"}
          </DialogDescription>
        </DialogHeader>

        {/* Initial State - Enable or Disable */}
        {step === "initial" && (
          <div className="space-y-4">
            {isEnabled ? (
              <>
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <ShieldCheck className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      2FA is enabled
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Your account has an extra layer of security
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    To disable 2FA, enter a code from your authenticator app or a backup code:
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code"
                      value={disableCode}
                      onChange={(e) => setDisableCode(e.target.value)}
                      maxLength={8}
                    />
                    <Button
                      variant="destructive"
                      onClick={handleDisable}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldOff className="h-4 w-4 mr-2" />
                      )}
                      Disable
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Two-factor authentication adds an extra layer of security to your account.
                    You&apos;ll need to enter a code from your authenticator app when signing in.
                  </p>

                  <div className="space-y-2">
                    <p className="font-medium text-sm">You&apos;ll need:</p>
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                      <li>An authenticator app (Google Authenticator, Authy, etc.)</li>
                      <li>Your phone to scan the QR code</li>
                    </ul>
                  </div>
                </div>

                <Button onClick={handleSetup} disabled={isLoading} className="w-full">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Set up 2FA
                </Button>
              </>
            )}
          </div>
        )}

        {/* QR Code Step */}
        {step === "qr" && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Scan this QR code with your authenticator app
              </p>
              {qrCode && (
                <div className="inline-block p-4 bg-white rounded-lg">
                  <Image
                    src={qrCode}
                    alt="2FA QR Code"
                    width={200}
                    height={200}
                    className="mx-auto"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Or enter this code manually:</Label>
              <div className="flex gap-2">
                <Input value={secret} readOnly className="font-mono text-sm" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(secret, "secret")}
                >
                  {copiedSecret ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button onClick={() => setStep("verify")} className="w-full">
              Continue
            </Button>
          </div>
        )}

        {/* Verification Step */}
        {step === "verify" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Enter the 6-digit code from your authenticator app to verify setup
            </p>

            <div className="space-y-2">
              <Label htmlFor="verifyCode">Verification Code</Label>
              <Input
                id="verifyCode"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("qr")} className="flex-1">
                Back
              </Button>
              <Button onClick={handleVerify} disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify
              </Button>
            </div>
          </div>
        )}

        {/* Backup Codes Step */}
        {step === "backup" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <Shield className="h-5 w-5 text-amber-600" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Save these backup codes in a safe place
              </p>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400">
              If you lose access to your authenticator app, you can use these codes to sign in.
              Each code can only be used once.
            </p>

            <div className="grid grid-cols-2 gap-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              {backupCodes.map((code, i) => (
                <Badge key={i} variant="outline" className="font-mono justify-center py-2">
                  {code}
                </Badge>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => copyToClipboard(backupCodes.join("\n"), "backup")}
              className="w-full"
            >
              {copiedBackup ? (
                <Check className="mr-2 h-4 w-4 text-green-600" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              Copy all codes
            </Button>

            <Button onClick={handleComplete} className="w-full">
              I&apos;ve saved my backup codes
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
