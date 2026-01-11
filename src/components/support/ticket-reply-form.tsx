"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { replyToSupportTicket } from "@/lib/actions/support";
import { useRouter } from "next/navigation";

interface TicketReplyFormProps {
  ticketId: string;
}

export function TicketReplyForm({ ticketId }: TicketReplyFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (message.trim().length < 10) {
      toast.error("Please provide more detail (at least 10 characters)");
      return;
    }

    setLoading(true);

    try {
      await replyToSupportTicket(ticketId, message.trim());
      toast.success("Reply sent successfully");
      setMessage("");
      router.refresh();
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send reply");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        placeholder="Type your reply here..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="min-h-[100px]"
        disabled={loading}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={loading || !message.trim()}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Send Reply
        </Button>
      </div>
    </form>
  );
}
