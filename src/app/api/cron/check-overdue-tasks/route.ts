import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, getTaskOverdueEmail } from "@/lib/email";
import { randomUUID } from "crypto";

// This endpoint should be called by a cron job (e.g., Vercel Cron) daily
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/check-overdue-tasks", "schedule": "0 8 * * *" }] }

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all overdue tasks that are not completed
    // A task is overdue if dueDate < today and status is PENDING or OVERDUE
    const overdueTasks = await prisma.task.findMany({
      where: {
        dueDate: {
          lt: today,
        },
        status: {
          in: ["PENDING", "OVERDUE"],
        },
        completedAt: null,
        assignedToId: {
          not: null,
        },
      },
      include: {
        Practice: true,
        User_Task_assignedToIdToUser: true,
      },
    });

    const notifications: { taskId: string; taskTitle: string; email: string }[] = [];
    let tasksUpdatedToOverdue = 0;

    for (const task of overdueTasks) {
      // Update task status to OVERDUE if not already
      if (task.status === "PENDING") {
        await prisma.task.update({
          where: { id: task.id },
          data: {
            status: "OVERDUE",
            updatedAt: new Date(),
          },
        });
        tasksUpdatedToOverdue++;
      }

      const assignedUser = task.User_Task_assignedToIdToUser;
      if (!assignedUser || !assignedUser.isActive) continue;

      // Check user's notification preference for overdue tasks
      if (!assignedUser.notifyTaskOverdue) continue;

      // Check if we already sent a notification for this task today
      // This prevents duplicate daily notifications
      const existingAlertToday = await prisma.alert.findFirst({
        where: {
          relatedTaskId: task.id,
          recipientId: assignedUser.id,
          alertType: "TASK_OVERDUE",
          createdAt: {
            gte: today,
          },
        },
      });

      if (existingAlertToday) continue;

      // Create alert record
      const alert = await prisma.alert.create({
        data: {
          id: randomUUID(),
          practiceId: task.practiceId,
          alertType: "TASK_OVERDUE",
          relatedTaskId: task.id,
          recipientId: assignedUser.id,
          channel: "EMAIL",
          message: `Task "${task.title}" is overdue. It was due on ${task.dueDate.toLocaleDateString("en-ZA")}.`,
          scheduledFor: new Date(),
          status: "PENDING",
        },
      });

      // Send email notification
      try {
        const emailContent = getTaskOverdueEmail({
          recipientName: assignedUser.name || assignedUser.email.split("@")[0],
          taskTitle: task.title,
          dueDate: task.dueDate.toLocaleDateString("en-ZA", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          taskUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tasks`,
        });

        const result = await sendEmail({
          to: assignedUser.email,
          subject: emailContent.subject,
          html: emailContent.html,
        });

        // Update alert status to SENT
        await prisma.alert.update({
          where: { id: alert.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
            externalId: result.id,
          },
        });

        notifications.push({
          taskId: task.id,
          taskTitle: task.title,
          email: assignedUser.email,
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
        console.error(`Failed to send overdue task email for task ${task.id}:`, emailError);
      }
    }

    return NextResponse.json({
      success: true,
      overdueTasksFound: overdueTasks.length,
      tasksUpdatedToOverdue,
      notificationsSent: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Check overdue tasks cron job error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
