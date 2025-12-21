import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LifeBuoy,
  Search,
  ExternalLink,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { getSupportTickets } from "@/lib/actions/admin/support";
import { format } from "date-fns";
import Link from "next/link";

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; category?: string }>;
}) {
  const params = await searchParams;
  const { tickets, total } = await getSupportTickets({
    status: params.status as "OPEN" | "IN_PROGRESS" | "WAITING_RESPONSE" | "RESOLVED" | "CLOSED" | undefined,
    priority: params.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined,
    category: params.category as "BILLING" | "TECHNICAL" | "FEATURE_REQUEST" | "BUG_REPORT" | "ACCOUNT" | "OTHER" | undefined,
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "HIGH": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "MEDIUM": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default: return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS": return "bg-purple-100 text-purple-800";
      case "WAITING_RESPONSE": return "bg-yellow-100 text-yellow-800";
      case "RESOLVED": return "bg-green-100 text-green-800";
      case "CLOSED": return "bg-slate-100 text-slate-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Support Tickets</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {total} tickets total
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-wrap gap-4">
            <select
              name="status"
              defaultValue={params.status || ""}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_RESPONSE">Waiting Response</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <select
              name="priority"
              defaultValue={params.priority || ""}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <select
              name="category"
              defaultValue={params.category || ""}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="">All Categories</option>
              <option value="BILLING">Billing</option>
              <option value="TECHNICAL">Technical</option>
              <option value="FEATURE_REQUEST">Feature Request</option>
              <option value="BUG_REPORT">Bug Report</option>
              <option value="ACCOUNT">Account</option>
              <option value="OTHER">Other</option>
            </select>
            <Button type="submit">Filter</Button>
          </form>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5" />
            All Tickets
          </CardTitle>
          <CardDescription>
            Click on a ticket to view and respond
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              No tickets found
            </p>
          ) : (
            <div className="divide-y dark:divide-slate-700">
              {tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/admin/support/${ticket.id}`}
                  className="block py-4 hover:bg-slate-50 dark:hover:bg-slate-800 -mx-4 px-4 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {ticket.priority === "URGENT" && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        <h3 className="font-medium text-slate-900 dark:text-white">
                          {ticket.subject}
                        </h3>
                      </div>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status.replace("_", " ")}
                        </Badge>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Badge variant="outline">{ticket.category}</Badge>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm text-slate-500">
                        {ticket.userEmail}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(ticket.createdAt), "MMM d, HH:mm")}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {ticket._count.Messages} messages
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-400 ml-4" />
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
