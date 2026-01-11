import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, getDocumentExpiryEmail } from "@/lib/email";
import { addDays, differenceInDays } from "date-fns";
import { randomUUID } from "crypto";

// This endpoint should be called by a cron job (e.g., Vercel Cron) daily
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/check-expiry", "schedule": "0 8 * * *" }] }

const REMINDER_DAYS = [90, 60, 30, 14, 7, 0];

// Helper to check if user wants notification for specific days until expiry
function shouldNotifyUser(user: { notifyExpiry90Days: boolean; notifyExpiry60Days: boolean; notifyExpiry30Days: boolean; notifyExpiryCritical: boolean }, daysUntilExpiry: number): boolean {
  if (daysUntilExpiry === 90) return user.notifyExpiry90Days;
  if (daysUntilExpiry === 60) return user.notifyExpiry60Days;
  if (daysUntilExpiry === 30) return user.notifyExpiry30Days;
  if (daysUntilExpiry <= 14) return user.notifyExpiryCritical; // 14, 7, 0 days
  return false;
}

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find documents expiring within the next 90 days
    const expiringDocuments = await prisma.document.findMany({
      where: {
        expiryDate: {
          gte: today,
          lte: addDays(today, 90),
        },
        status: {
          not: "EXPIRED",
        },
      },
      include: {
        Practice: true,
        DocumentType: true,
        User_Document_uploadedByIdToUser: true,
      },
    });

    const notifications: { documentId: string; daysUntil: number; email: string }[] = [];

    for (const doc of expiringDocuments) {
      if (!doc.expiryDate) continue;

      const daysUntilExpiry = differenceInDays(doc.expiryDate, today);

      // Check if we should send a reminder today
      if (REMINDER_DAYS.includes(daysUntilExpiry)) {
        // Get practice owner/admin email with notification preferences
        const practiceUsers = await prisma.user.findMany({
          where: {
            practiceId: doc.practiceId,
            role: {
              in: ["PRACTICE_OWNER", "ADMIN"],
            },
            isActive: true,
          },
          select: {
            id: true,
            email: true,
            notifyExpiry90Days: true,
            notifyExpiry60Days: true,
            notifyExpiry30Days: true,
            notifyExpiryCritical: true,
          },
        });

        for (const user of practiceUsers) {
          // Check if user wants this notification based on their preferences
          if (!shouldNotifyUser(user, daysUntilExpiry)) {
            continue; // Skip this user - they've disabled this notification type
          }
          // Check if we already sent this reminder
          const existingAlert = await prisma.alert.findFirst({
            where: {
              relatedDocumentId: doc.id,
              recipientId: user.id,
              alertType: "DOCUMENT_EXPIRY",
              createdAt: {
                gte: today,
              },
            },
          });

          if (!existingAlert) {
            // Create alert record
            const alert = await prisma.alert.create({
              data: {
                id: randomUUID(),
                practiceId: doc.practiceId,
                alertType: "DOCUMENT_EXPIRY",
                relatedDocumentId: doc.id,
                recipientId: user.id,
                channel: "EMAIL",
                message: `${doc.DocumentType.name} expires in ${daysUntilExpiry} days`,
                scheduledFor: new Date(),
                status: "PENDING",
              },
            });

            // Send email
            try {
              const emailContent = getDocumentExpiryEmail({
                practiceName: doc.Practice.name,
                documentName: doc.DocumentType.name,
                expiryDate: doc.expiryDate.toLocaleDateString("en-ZA"),
                daysUntilExpiry,
                documentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/documents/${doc.id}`,
              });

              const result = await sendEmail({
                to: user.email,
                subject: emailContent.subject,
                html: emailContent.html,
              });

              // Update alert status
              await prisma.alert.update({
                where: { id: alert.id },
                data: {
                  status: "SENT",
                  sentAt: new Date(),
                  externalId: result.id,
                },
              });

              notifications.push({
                documentId: doc.id,
                daysUntil: daysUntilExpiry,
                email: user.email,
              });
            } catch (emailError) {
              // Update alert status on failure
              await prisma.alert.update({
                where: { id: alert.id },
                data: {
                  status: "FAILED",
                  errorMessage: emailError instanceof Error ? emailError.message : "Unknown error",
                },
              });
            }
          }
        }
      }
    }

    // Update expired documents
    await prisma.document.updateMany({
      where: {
        expiryDate: {
          lt: today,
        },
        status: {
          not: "EXPIRED",
        },
      },
      data: {
        status: "EXPIRED",
      },
    });

    // Update expiring soon status
    await prisma.document.updateMany({
      where: {
        expiryDate: {
          gte: today,
          lte: addDays(today, 30),
        },
        status: "CURRENT",
      },
      data: {
        status: "EXPIRING_SOON",
      },
    });

    return NextResponse.json({
      success: true,
      documentsChecked: expiringDocuments.length,
      notificationsSent: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
