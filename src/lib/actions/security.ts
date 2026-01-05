"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authenticator } from "otplib";
import * as QRCode from "qrcode";

// Get current user from database
async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const dbUser = await prisma.user.findFirst({
    where: { email: user.email },
  });

  return dbUser;
}

// Change password using Supabase auth
export async function changePassword(currentPassword: string, newPassword: string) {
  const supabase = await createClient();

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify current password by attempting to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    return { success: false, error: "Current password is incorrect" };
  }

  // Update to new password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

// Get active sessions (Supabase doesn't expose this directly, so we'll track our own)
// For now, return the current session info
export async function getActiveSessions() {
  const supabase = await createClient();

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return { sessions: [], error: error?.message };
  }

  // Return current session info
  const currentSession = {
    id: session.access_token.slice(-8), // Use last 8 chars as pseudo-ID
    device: "Current Device",
    lastActive: new Date().toISOString(),
    isCurrent: true,
  };

  return { sessions: [currentSession], error: null };
}

// Sign out from all devices
export async function signOutAllDevices() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut({ scope: "global" });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Sign out from a specific session (redirect to sign in)
export async function signOutCurrentSession() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut({ scope: "local" });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ==================== TWO-FACTOR AUTHENTICATION ====================

// Get 2FA status for current user
export async function get2FAStatus() {
  const user = await getCurrentUser();

  if (!user) {
    return { enabled: false, error: "Not authenticated" };
  }

  return {
    enabled: user.twoFactorEnabled,
    error: null,
  };
}

// Generate 2FA setup data (secret + QR code)
export async function setup2FA() {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  if (user.twoFactorEnabled) {
    return { success: false, error: "2FA is already enabled" };
  }

  // Generate a new secret
  const secret = authenticator.generateSecret();

  // Create the OTP auth URL for QR code
  const otpauthUrl = authenticator.keyuri(
    user.email,
    "OHSC Compliance",
    secret
  );

  // Generate QR code as data URL
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  // Generate backup codes
  const backupCodes = Array.from({ length: 8 }, () =>
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );

  // Store the secret temporarily (will be confirmed when user verifies)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorSecret: secret,
      twoFactorBackupCodes: JSON.stringify(backupCodes),
      updatedAt: new Date(),
    },
  });

  return {
    success: true,
    qrCode: qrCodeDataUrl,
    secret: secret,
    backupCodes: backupCodes,
  };
}

// Verify 2FA code and enable 2FA
export async function verify2FASetup(code: string) {
  const user = await getCurrentUser();

  if (!user || !user.twoFactorSecret) {
    return { success: false, error: "2FA setup not initiated" };
  }

  // Verify the code
  const isValid = authenticator.verify({
    token: code,
    secret: user.twoFactorSecret,
  });

  if (!isValid) {
    return { success: false, error: "Invalid verification code" };
  }

  // Enable 2FA
  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorEnabled: true,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/settings");
  return { success: true };
}

// Disable 2FA
export async function disable2FA(code: string) {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    return { success: false, error: "2FA is not enabled" };
  }

  // Verify the code or check if it's a backup code
  const isValidTotp = authenticator.verify({
    token: code,
    secret: user.twoFactorSecret,
  });

  let isValidBackup = false;
  let remainingBackupCodes: string[] = [];

  if (!isValidTotp && user.twoFactorBackupCodes) {
    const backupCodes = JSON.parse(user.twoFactorBackupCodes) as string[];
    const codeIndex = backupCodes.findIndex(
      (bc) => bc.toUpperCase() === code.toUpperCase()
    );
    if (codeIndex !== -1) {
      isValidBackup = true;
      remainingBackupCodes = backupCodes.filter((_, i) => i !== codeIndex);
    }
  }

  if (!isValidTotp && !isValidBackup) {
    return { success: false, error: "Invalid verification code" };
  }

  // Disable 2FA
  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/settings");
  return { success: true };
}

// Check if user has 2FA enabled (for login flow)
export async function check2FARequired(email: string) {
  const user = await prisma.user.findFirst({
    where: { email },
    select: {
      twoFactorEnabled: true,
      role: true,
    },
  });

  if (!user) {
    return { required: false, error: null };
  }

  return {
    required: user.twoFactorEnabled,
    isOwner: user.role === "PRACTICE_OWNER" || user.role === "SUPER_ADMIN",
    error: null,
  };
}

// Verify 2FA code during login
export async function verify2FALogin(email: string, code: string) {
  const user = await prisma.user.findFirst({
    where: { email },
  });

  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return { success: false, error: "2FA not enabled for this user" };
  }

  // Verify the code
  const isValidTotp = authenticator.verify({
    token: code,
    secret: user.twoFactorSecret,
  });

  // Check backup codes if TOTP fails
  if (!isValidTotp && user.twoFactorBackupCodes) {
    const backupCodes = JSON.parse(user.twoFactorBackupCodes) as string[];
    const codeIndex = backupCodes.findIndex(
      (bc) => bc.toUpperCase() === code.toUpperCase()
    );

    if (codeIndex !== -1) {
      // Remove used backup code
      const remainingCodes = backupCodes.filter((_, i) => i !== codeIndex);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorBackupCodes: JSON.stringify(remainingCodes),
          updatedAt: new Date(),
        },
      });
      return { success: true };
    }
  }

  if (!isValidTotp) {
    return { success: false, error: "Invalid verification code" };
  }

  return { success: true };
}
