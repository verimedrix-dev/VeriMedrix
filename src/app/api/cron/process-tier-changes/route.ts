import { NextResponse } from "next/server";
import { processAllScheduledTierChanges } from "@/lib/actions/billing";

/**
 * Cron endpoint to process scheduled subscription tier changes
 *
 * This runs daily to apply any scheduled downgrades/upgrades that are due.
 * Payment-provider agnostic - works with any payment provider.
 *
 * Configure in vercel.json: { "path": "/api/cron/process-tier-changes", "schedule": "0 0 * * *" }
 * Runs at midnight UTC daily
 */
export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Cron] Starting scheduled tier changes processing...");

    const result = await processAllScheduledTierChanges();

    if (!result.success) {
      console.error("[Cron] Tier changes processing failed:", result.errors);
      return NextResponse.json(
        {
          success: false,
          error: "Processing failed",
          details: result.errors,
        },
        { status: 500 }
      );
    }

    console.log(`[Cron] Tier changes processing complete. Processed: ${result.processed}, Applied: ${result.applied}`);

    return NextResponse.json({
      success: true,
      processed: result.processed,
      applied: result.applied,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error("[Cron] Tier changes processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
