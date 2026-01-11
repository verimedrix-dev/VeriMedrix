"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/actions/practice";
import { revalidatePath } from "next/cache";
import { TicketCategory, TicketPriority, TicketStatus } from "@prisma/client";
import { invalidateCache, cacheKeys } from "@/lib/redis";

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
