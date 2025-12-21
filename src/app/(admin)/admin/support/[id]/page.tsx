"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  LifeBuoy,
  Send,
  Clock,
  User,
  Shield,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { getSupportTicketById, replyToTicket, updateTicketStatus } from "@/lib/actions/admin/support";
import { format } from "date-fns";
import { useParams } from "next/navigation";

type Ticket = Awaited<ReturnType<typeof getSupportTicketById>>;

export default function AdminSupportTicketPage() {
  const params = useParams();
  const id = params.id as string;
  const [ticket, setTicket] = useState<Ticket>(null);
  const [reply, setReply] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getSupportTicketById(id).then(setTicket);
  }, [id]);

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const handleReply = () => {
    if (!reply.trim()) return;
    startTransition(async () => {
      await replyToTicket(id, reply);
      setReply("");
      const updated = await getSupportTicketById(id);
      setTicket(updated);
    });
  };

  const handleResolve = () => {
    startTransition(async () => {
      await updateTicketStatus(id, "RESOLVED");
      const updated = await getSupportTicketById(id);
      setTicket(updated);
    });
  };

  const handleClose = () => {
    startTransition(async () => {
      await updateTicketStatus(id, "CLOSED");
      const updated = await getSupportTicketById(id);
      setTicket(updated);
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT": return "bg-red-100 text-red-800";
      case "HIGH": return "bg-orange-100 text-orange-800";
      case "MEDIUM": return "bg-yellow-100 text-yellow-800";
      default: return "bg-slate-100 text-slate-800";
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
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {ticket.subject}
          </h1>
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
        <div className="flex items-center gap-2">
          {ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" && (
            <Button variant="outline" onClick={handleResolve} disabled={isPending}>
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Resolve
            </Button>
          )}
          {ticket.status !== "CLOSED" && (
            <Button variant="outline" onClick={handleClose} disabled={isPending}>
              <XCircle className="h-4 w-4 mr-2" />
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Ticket Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <User className="h-4 w-4" />
              {ticket.userEmail}
            </div>
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <Clock className="h-4 w-4" />
              {format(new Date(ticket.createdAt), "MMM d, yyyy HH:mm")}
            </div>
          </div>
          <p className="mt-4 text-slate-700 dark:text-slate-300">
            {ticket.description}
          </p>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5" />
            Conversation
          </CardTitle>
          <CardDescription>
            {ticket.Messages.length} messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ticket.Messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg ${
                  message.isFromAdmin
                    ? "bg-blue-50 dark:bg-blue-900/20 ml-8"
                    : "bg-slate-50 dark:bg-slate-800 mr-8"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {message.isFromAdmin ? (
                      <Shield className="h-4 w-4 text-blue-600" />
                    ) : (
                      <User className="h-4 w-4 text-slate-600" />
                    )}
                    <span className="font-medium text-slate-900 dark:text-white">
                      {message.senderName}
                    </span>
                    {message.isFromAdmin && (
                      <Badge variant="outline" className="text-xs">Admin</Badge>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {format(new Date(message.createdAt), "MMM d, HH:mm")}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {message.message}
                </p>
              </div>
            ))}
          </div>

          {/* Reply Form */}
          {ticket.status !== "CLOSED" && (
            <div className="mt-6 pt-6 border-t dark:border-slate-700">
              <Textarea
                placeholder="Type your reply..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
              />
              <div className="flex justify-end mt-4">
                <Button onClick={handleReply} disabled={isPending || !reply.trim()}>
                  {isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Reply
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
