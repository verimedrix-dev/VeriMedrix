import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ensureUserAndPractice } from "@/lib/actions/practice";
import { getUserSupportTickets } from "@/lib/actions/support";
import { HelpCircle, MessageSquare, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { NewTicketDialog } from "@/components/support/new-ticket-dialog";
import { TicketCategory, TicketStatus, TicketPriority } from "@prisma/client";

async function getSupportData() {
  try {
    await ensureUserAndPractice();
    const tickets = await getUserSupportTickets();
    return { tickets };
  } catch (error) {
    console.error("Support data fetch error:", error);
    return { tickets: [] };
  }
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
      return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
    case "HIGH":
      return <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs">High</Badge>;
    case "MEDIUM":
      return null; // Don't show badge for medium
    case "LOW":
      return <Badge variant="outline" className="text-xs">Low</Badge>;
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

function getStatusIcon(status: TicketStatus) {
  switch (status) {
    case "OPEN":
      return <MessageSquare className="h-5 w-5 text-blue-500" />;
    case "IN_PROGRESS":
      return <Clock className="h-5 w-5 text-yellow-500" />;
    case "WAITING_RESPONSE":
      return <AlertCircle className="h-5 w-5 text-purple-500" />;
    case "RESOLVED":
    case "CLOSED":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    default:
      return <MessageSquare className="h-5 w-5 text-slate-500" />;
  }
}

export default async function SupportPage() {
  const { tickets } = await getSupportData();

  const openTickets = tickets.filter(t => ["OPEN", "IN_PROGRESS"].includes(t.status));
  const awaitingResponse = tickets.filter(t => t.status === "WAITING_RESPONSE");
  const resolvedTickets = tickets.filter(t => ["RESOLVED", "CLOSED"].includes(t.status));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Support</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Get help from our support team
          </p>
        </div>
        <NewTicketDialog />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Open Tickets</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{openTickets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Needs Your Response</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{awaitingResponse.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Resolved</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{resolvedTickets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Support Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="py-12 text-center">
              <HelpCircle className="h-12 w-12 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No support tickets yet</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Need help? Create a support ticket and our team will assist you.
              </p>
              <NewTicketDialog />
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/support/${ticket.id}`}
                  className="block"
                >
                  <div className={`p-4 rounded-lg border hover:shadow-md transition-all ${
                    ticket.status === "WAITING_RESPONSE"
                      ? "border-l-4 border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20"
                      : "hover:border-blue-200 dark:hover:border-blue-800"
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getStatusIcon(ticket.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-medium text-slate-900 dark:text-white truncate">
                            {ticket.subject}
                          </h3>
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
                          {ticket.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs font-normal">
                              {getCategoryLabel(ticket.category)}
                            </Badge>
                          </span>
                          <span>
                            {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                          </span>
                          {ticket._count.Messages > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {ticket._count.Messages} {ticket._count.Messages === 1 ? "message" : "messages"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
