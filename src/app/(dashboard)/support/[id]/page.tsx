import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSupportTicket } from "@/lib/actions/support";
import { ArrowLeft, Clock, MessageSquare, CheckCircle2, AlertCircle, User, Shield } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TicketCategory, TicketStatus, TicketPriority } from "@prisma/client";
import { TicketReplyForm } from "@/components/support/ticket-reply-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

function getStatusBadge(status: TicketStatus) {
  switch (status) {
    case "OPEN":
      return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Open</Badge>;
    case "IN_PROGRESS":
      return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">In Progress</Badge>;
    case "WAITING_RESPONSE":
      return <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Awaiting Your Response</Badge>;
    case "RESOLVED":
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Resolved</Badge>;
    case "CLOSED":
      return <Badge variant="secondary">Closed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getPriorityBadge(priority: TicketPriority) {
  switch (priority) {
    case "URGENT":
      return <Badge variant="destructive">Urgent</Badge>;
    case "HIGH":
      return <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">High Priority</Badge>;
    case "MEDIUM":
      return <Badge variant="outline">Medium Priority</Badge>;
    case "LOW":
      return <Badge variant="outline">Low Priority</Badge>;
    default:
      return null;
  }
}

function getCategoryLabel(category: TicketCategory) {
  const labels: Record<TicketCategory, string> = {
    BILLING: "Billing",
    TECHNICAL: "Technical Issue",
    FEATURE_REQUEST: "Feature Request",
    BUG_REPORT: "Bug Report",
    ACCOUNT: "Account",
    OTHER: "Other",
  };
  return labels[category] || category;
}

export default async function SupportTicketPage({ params }: PageProps) {
  const { id } = await params;

  let ticket;
  try {
    ticket = await getSupportTicket(id);
  } catch {
    notFound();
  }

  if (!ticket) {
    notFound();
  }

  const isClosed = ticket.status === "CLOSED";
  const isResolved = ticket.status === "RESOLVED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/support">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {ticket.subject}
            </h1>
            {getStatusBadge(ticket.status)}
            {getPriorityBadge(ticket.priority)}
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
            <Badge variant="outline">{getCategoryLabel(ticket.category)}</Badge>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Opened {format(new Date(ticket.createdAt), "MMM d, yyyy 'at' h:mm a")}
            </span>
          </div>
        </div>
      </div>

      {/* Status Alert */}
      {ticket.status === "WAITING_RESPONSE" && (
        <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <p className="text-purple-800 dark:text-purple-200">
                Our support team has responded. Please review their message and reply if you need further assistance.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isResolved && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <p className="text-green-800 dark:text-green-200">
                This ticket has been marked as resolved. If you still need help, you can reply to reopen it.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Original Message */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-base">You</CardTitle>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {format(new Date(ticket.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {ticket.description}
          </p>
        </CardContent>
      </Card>

      {/* Conversation */}
      {ticket.Messages.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversation
          </h2>

          {ticket.Messages.map((message) => (
            <Card
              key={message.id}
              className={message.isFromAdmin ? "border-l-4 border-l-blue-500" : ""}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    message.isFromAdmin
                      ? "bg-blue-100 dark:bg-blue-900/30"
                      : "bg-slate-100 dark:bg-slate-800"
                  }`}>
                    {message.isFromAdmin ? (
                      <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <User className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">
                        {message.isFromAdmin ? "VeriMedrix Support" : "You"}
                      </CardTitle>
                      {message.isFromAdmin && (
                        <Badge variant="outline" className="text-xs">Staff</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {format(new Date(message.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {message.message}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reply Form */}
      {!isClosed && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reply</CardTitle>
          </CardHeader>
          <CardContent>
            <TicketReplyForm ticketId={ticket.id} />
          </CardContent>
        </Card>
      )}

      {isClosed && (
        <Card className="border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
          <CardContent className="py-6 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              This ticket has been closed. If you need further assistance, please create a new ticket.
            </p>
            <Link href="/support">
              <Button className="mt-4">
                Create New Ticket
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
