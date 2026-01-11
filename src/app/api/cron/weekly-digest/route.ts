import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, getWeeklyDigestEmail } from "@/lib/email";
import { addDays, differenceInDays } from "date-fns";

// This endpoint runs every Monday at 9 AM UTC
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/weekly-digest", "schedule": "0 9 * * 1" }] }

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const digestsSent: { email: string; practice: string }[] = [];

    // Get all users who have enabled weekly digest
    const usersWithDigest = await prisma.user.findMany({
      where: {
        notifyWeeklyDigest: true,
        isActive: true,
        practiceId: { not: null },
      },
      include: {
        Practice: true,
      },
    });

    for (const user of usersWithDigest) {
      if (!user.Practice || !user.email) continue;

      try {
        // Get documents expiring in next 90 days for this practice
        const expiringDocuments = await prisma.document.findMany({
          where: {
            practiceId: user.Practice.id,
            expiryDate: {
              gte: today,
              lte: addDays(today, 90),
            },
            status: { not: "EXPIRED" },
          },
          include: {
            DocumentType: true,
          },
          orderBy: { expiryDate: "asc" },
          take: 10, // Limit to top 10 expiring docs
        });

        // Get task counts
        const [pendingTasks, overdueTasks, totalDocuments, compliantDocuments] = await Promise.all([
          prisma.task.count({
            where: {
              practiceId: user.Practice.id,
              status: "PENDING",
            },
          }),
          prisma.task.count({
            where: {
              practiceId: user.Practice.id,
              status: "OVERDUE",
            },
          }),
          prisma.document.count({
            where: {
              practiceId: user.Practice.id,
            },
          }),
          prisma.document.count({
            where: {
              practiceId: user.Practice.id,
              status: "CURRENT",
            },
          }),
        ]);

        // Calculate compliance score (simple percentage of current documents)
        const complianceScore = totalDocuments > 0
          ? Math.round((compliantDocuments / totalDocuments) * 100)
          : 100;

        // Format expiring documents for email
        const expiringDocsForEmail = expiringDocuments.map(doc => ({
          name: doc.DocumentType.name,
          daysUntil: doc.expiryDate ? differenceInDays(doc.expiryDate, today) : 0,
        }));

        // Generate and send email
        const { subject, html } = getWeeklyDigestEmail({
          userName: user.name || user.email.split("@")[0],
          practiceName: user.Practice.name,
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://verimedrix.com"}/dashboard`,
          expiringDocuments: expiringDocsForEmail,
          pendingTasks,
          overdueTasks,
          complianceScore,
        });

        await sendEmail({
          to: user.email,
          subject,
          html,
        });

        digestsSent.push({
          email: user.email,
          practice: user.Practice.name,
        });
      } catch (emailError) {
        console.error(`Failed to send weekly digest to ${user.email}:`, emailError);
      }
    }

    return NextResponse.json({
      success: true,
      digestsSent: digestsSent.length,
      details: digestsSent,
    });
  } catch (error) {
    console.error("Weekly digest cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
