import { NextResponse } from "next/server";
import { permanentlyDeleteExpiredAccounts } from "@/lib/actions/practice";

/**
 * Cron endpoint to permanently delete practice accounts that have passed their 30-day grace period.
 *
 * This endpoint should be called daily by a cron job service (e.g., Vercel Cron, GitHub Actions).
 *
 * Security: Protected by CRON_SECRET environment variable.
 *
 * Example Vercel cron configuration in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/delete-expired-accounts",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */
export async function GET(request: Request) {
  try {
    // Verify the request is from a legitimate cron job
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // In production, require the cron secret
    if (process.env.NODE_ENV === "production") {
      if (!cronSecret) {
        console.error("CRON_SECRET environment variable not set");
        return NextResponse.json(
          { error: "Server misconfiguration" },
          { status: 500 }
        );
      }

      if (authHeader !== `Bearer ${cronSecret}`) {
        console.warn("Unauthorized cron attempt");
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    console.log("Starting scheduled deletion of expired accounts...");

    const result = await permanentlyDeleteExpiredAccounts();

    console.log(`Cron job completed: ${result.deleted} accounts permanently deleted`);

    return NextResponse.json({
      success: true,
      message: `Permanently deleted ${result.deleted} expired account(s)`,
      deletedCount: result.deleted,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in delete-expired-accounts cron:", error);
    return NextResponse.json(
      {
        error: "Failed to process expired accounts",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility with different cron services
export async function POST(request: Request) {
  return GET(request);
}
