"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Loader2,
  Bot,
  User,
  AlertCircle,
  RotateCcw,
  LifeBuoy,
  Monitor,
  FileQuestion,
  Settings,
  Navigation,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { createSupportTicket } from "@/lib/actions/support";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const SUGGESTED_QUESTIONS = [
  {
    icon: Monitor,
    question: "How do I upload compliance documents?",
    description: "Learn about document management",
  },
  {
    icon: Navigation,
    question: "How do I navigate the dashboard?",
    description: "Understand the main features",
  },
  {
    icon: FileQuestion,
    question: "What features are available on my plan?",
    description: "Explore subscription features",
  },
  {
    icon: Settings,
    question: "How do I manage my notification settings?",
    description: "Configure alerts and emails",
  },
];

export function SupportChatbot() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageContent.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/support-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (response.redirected) {
        throw new Error("Session expired. Please refresh the page and try again.");
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server error. Please try again.");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  const handleNewChat = () => {
    setMessages([]);
    setError(null);
    setInput("");
  };

  const handleCreateTicket = async () => {
    if (messages.length === 0) return;
    setIsCreatingTicket(true);
    try {
      const conversationSummary = messages
        .map((m) => `${m.role === "user" ? "User" : "Support Assistant"}: ${m.content}`)
        .join("\n\n");

      const firstUserMessage = messages.find((m) => m.role === "user");
      const subject = firstUserMessage
        ? `Support: ${firstUserMessage.content.slice(0, 80)}${firstUserMessage.content.length > 80 ? "..." : ""}`
        : "Question from Support Chat";

      const description = `This ticket was created from the Support Chat where the user needed additional help.\n\n--- Conversation ---\n\n${conversationSummary}`;

      const ticket = await createSupportTicket({
        subject,
        description: description.slice(0, 1000),
        category: "TECHNICAL",
        priority: "MEDIUM",
      });

      // Send email notification to admin
      try {
        await fetch("/api/support-chat/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticketId: ticket.id,
            subject,
          }),
        });
      } catch {
        // Don't block the user if email fails
      }

      toast.success("Support ticket created. Our team will follow up.");
      router.push(`/support/${ticket.id}`);
    } catch {
      toast.error("Failed to create support ticket. Please try again.");
    } finally {
      setIsCreatingTicket(false);
    }
  };

  return (
    <Card className="flex flex-col" style={{ height: "500px" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Support Assistant
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ask me anything about using VeriMedrix
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleNewChat}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">
              Need help with the software?
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-5 max-w-sm">
              I can help you navigate VeriMedrix, understand features, and get the most out of the platform.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTED_QUESTIONS.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(item.question)}
                  className="flex items-start gap-2.5 p-3 text-left bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group"
                >
                  <div className="flex-shrink-0 h-8 w-8 rounded-md bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900 transition-colors">
                    <item.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white text-xs">
                      {item.question}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5",
                    message.role === "user"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0 prose-headings:my-2">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Escalation Banner */}
      {messages.length >= 2 && messages.some((m) => m.role === "assistant") && (
        <div className="mx-4 mb-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <LifeBuoy className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <p className="text-xs text-emerald-700 dark:text-emerald-300 truncate">
              Still need help? Create a support ticket for our team.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="flex-shrink-0 border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/50 text-xs h-7"
            onClick={handleCreateTicket}
            disabled={isCreatingTicket}
          >
            {isCreatingTicket ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <LifeBuoy className="h-3.5 w-3.5 mr-1" />
            )}
            Create Ticket
          </Button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 mt-1 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t dark:border-slate-700 p-3 bg-slate-50/50 dark:bg-slate-900/50">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about features, navigation, how to use..."
                disabled={isLoading}
                className="min-h-[44px] max-h-[120px] resize-none pr-4 py-2.5 rounded-lg border-slate-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-500 text-sm"
                rows={1}
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              size="default"
              className="h-[44px] px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
