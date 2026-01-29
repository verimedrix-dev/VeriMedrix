"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/actions/practice";
import { revalidatePath } from "next/cache";
import { TicketCategory, TicketPriority, TicketStatus } from "@prisma/client";
import { invalidateCache, cacheKeys } from "@/lib/redis";
import { sendEmail } from "@/lib/email";

// Get user's support tickets
export async function getUserSupportTickets() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const tickets = await prisma.supportTicket.findMany({
    where: {
      OR: [
        { userId: user.id },
        { userEmail: user.email },
      ],
    },
    include: {
      _count: { select: { Messages: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return tickets;
}

// Get a single ticket with messages
export async function getSupportTicket(ticketId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id: ticketId,
      OR: [
        { userId: user.id },
        { userEmail: user.email },
      ],
    },
    include: {
      Messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!ticket) throw new Error("Ticket not found");

  return ticket;
}

// Create a new support ticket
export async function createSupportTicket(data: {
  subject: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: user.id,
      userEmail: user.email,
      practiceId: user.practiceId,
      subject: data.subject,
      description: data.description,
      category: data.category,
      priority: data.priority || "MEDIUM",
      status: "OPEN",
    },
  });

  // Invalidate admin support cache
  await invalidateCache(cacheKeys.adminSupport());

  revalidatePath("/support");

  // Send email notification to admin (fire-and-forget)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.verimedrix.com";
  const practiceName = user.Practice?.name || "Unknown Practice";
  sendEmail({
    to: "admin@verimedrix.com",
    subject: `New Support Ticket: ${data.subject.slice(0, 60)}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#10b981,#059669);padding:30px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;">New Support Ticket</h1>
      <p style="color:#d1fae5;margin:8px 0 0;font-size:14px;">A user needs assistance</p>
    </div>
    <div style="background:#ffffff;padding:30px;border:1px solid #e2e8f0;border-top:none;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#64748b;font-size:14px;width:120px;">Subject:</td><td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:500;">${data.subject}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Category:</td><td style="padding:8px 0;color:#1e293b;font-size:14px;">${data.category}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Priority:</td><td style="padding:8px 0;color:#1e293b;font-size:14px;">${data.priority || "MEDIUM"}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">User:</td><td style="padding:8px 0;color:#1e293b;font-size:14px;">${user.name || user.email}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Email:</td><td style="padding:8px 0;color:#1e293b;font-size:14px;">${user.email}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Practice:</td><td style="padding:8px 0;color:#1e293b;font-size:14px;">${practiceName}</td></tr>
      </table>
      <div style="margin-top:16px;padding:12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
        <p style="margin:0 0 4px;color:#64748b;font-size:12px;font-weight:600;">Description:</p>
        <p style="margin:0;color:#1e293b;font-size:13px;white-space:pre-wrap;">${data.description.slice(0, 500)}</p>
      </div>
      <div style="text-align:center;margin-top:24px;">
        <a href="${appUrl}/admin/support/${ticket.id}" style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#ffffff;text-decoration:none;padding:12px 30px;border-radius:8px;font-weight:600;font-size:14px;">View Ticket in Admin</a>
      </div>
    </div>
    <div style="text-align:center;padding:20px;color:#94a3b8;font-size:12px;">
      <p style="margin:0;">&copy; ${new Date().getFullYear()} VeriMedrix. Automated notification.</p>
    </div>
  </div>
</body>
</html>`,
  }).catch((err) => console.error("Failed to send support ticket email:", err));

  return ticket;
}

// Add a message/reply to a ticket
export async function replyToSupportTicket(ticketId: string, message: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Verify the ticket belongs to the user
  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id: ticketId,
      OR: [
        { userId: user.id },
        { userEmail: user.email },
      ],
    },
  });

  if (!ticket) throw new Error("Ticket not found");

  // Cannot reply to closed tickets
  if (ticket.status === "CLOSED") {
    throw new Error("Cannot reply to a closed ticket");
  }

  const reply = await prisma.supportTicketMessage.create({
    data: {
      ticketId,
      senderId: user.id,
      senderEmail: user.email,
      senderName: user.name || user.email,
      isFromAdmin: false,
      message,
      attachments: [],
    },
  });

  // Update ticket status to open if it was waiting for response
  if (ticket.status === "WAITING_RESPONSE" || ticket.status === "RESOLVED") {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: "OPEN" },
    });
  }

  // Invalidate admin support cache
  await invalidateCache(cacheKeys.adminSupport());

  revalidatePath("/support");
  revalidatePath(`/support/${ticketId}`);

  return reply;
}

// Get ticket counts for badges
export async function getSupportTicketCounts() {
  const user = await getCurrentUser();
  if (!user) return { total: 0, open: 0, awaitingResponse: 0 };

  const [total, open, awaitingResponse] = await Promise.all([
    prisma.supportTicket.count({
      where: {
        OR: [
          { userId: user.id },
          { userEmail: user.email },
        ],
      },
    }),
    prisma.supportTicket.count({
      where: {
        OR: [
          { userId: user.id },
          { userEmail: user.email },
        ],
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
    }),
    prisma.supportTicket.count({
      where: {
        OR: [
          { userId: user.id },
          { userEmail: user.email },
        ],
        status: "WAITING_RESPONSE",
      },
    }),
  ]);

  return { total, open, awaitingResponse };
}
