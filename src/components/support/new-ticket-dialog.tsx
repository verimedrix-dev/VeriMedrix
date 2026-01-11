"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createSupportTicket } from "@/lib/actions/support";
import { TicketCategory, TicketPriority } from "@prisma/client";
import { useRouter } from "next/navigation";

const CATEGORIES: { value: TicketCategory; label: string; description: string }[] = [
  { value: "TECHNICAL", label: "Technical Issue", description: "Problems with the application" },
  { value: "BUG_REPORT", label: "Bug Report", description: "Something isn't working correctly" },
  { value: "BILLING", label: "Billing", description: "Questions about your subscription or payments" },
  { value: "ACCOUNT", label: "Account", description: "Account access or settings issues" },
  { value: "FEATURE_REQUEST", label: "Feature Request", description: "Suggest a new feature" },
  { value: "OTHER", label: "Other", description: "General questions or feedback" },
];

const PRIORITIES: { value: TicketPriority; label: string }[] = [
  { value: "LOW", label: "Low - General question" },
  { value: "MEDIUM", label: "Medium - Issue affecting work" },
  { value: "HIGH", label: "High - Urgent issue" },
];

export function NewTicketDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("OTHER");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    if (!description.trim()) {
      toast.error("Please describe your issue");
      return;
    }

    if (description.trim().length < 20) {
      toast.error("Please provide more details about your issue (at least 20 characters)");
      return;
    }

    setLoading(true);

    try {
      const ticket = await createSupportTicket({
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
      });

      toast.success("Support ticket created successfully");
      setOpen(false);
      resetForm();
      router.push(`/support/${ticket.id}`);
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubject("");
    setDescription("");
    setCategory("OTHER");
    setPriority("MEDIUM");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>
              Describe your issue and our team will respond as soon as possible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex flex-col">
                        <span>{cat.label}</span>
                        <span className="text-xs text-slate-500">{cat.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Brief summary of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Please describe your issue in detail. Include any error messages, steps to reproduce, or relevant information that will help us assist you."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px]"
              />
              <p className="text-xs text-slate-500">
                {description.length}/1000 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
