"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  MoreHorizontal,
  UserPlus,
  Loader2,
  Trash2,
  Camera,
  ImageIcon,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { completeTask, uncompleteTask, deleteTask, assignTask, getPracticeTeamMembers, uploadTaskEvidence } from "@/lib/actions/tasks";
import { Label } from "@/components/ui/label";

type TeamMember = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date;
  dueTime: string | null;
  status: string;
  completedAt: Date | null;
  evidenceUrl: string | null;
  User_Task_assignedToIdToUser?: { id: string; name: string | null } | null;
  TaskTemplate?: { id: string; name: string; requiresEvidence: boolean } | null;
};

function getStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
    case "VERIFIED":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case "PENDING":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-white">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case "OVERDUE":
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Overdue
        </Badge>
      );
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
}

export function TaskCard({ task }: { task: Task }) {
  const [loading, setLoading] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>(
    task.User_Task_assignedToIdToUser?.id || ""
  );
  const [assigning, setAssigning] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOverdue = task.status === "OVERDUE";
  const isCompleted = task.status === "COMPLETED" || task.status === "VERIFIED";
  const assignedTo = task.User_Task_assignedToIdToUser;
  const requiresEvidence = task.TaskTemplate?.requiresEvidence ?? false;

  // Load team members when assign dialog opens
  useEffect(() => {
    if (assignDialogOpen) {
      getPracticeTeamMembers().then(setTeamMembers);
    }
  }, [assignDialogOpen]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setEvidenceFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEvidencePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearEvidence = () => {
    setEvidenceFile(null);
    setEvidencePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleToggleComplete = async () => {
    if (isCompleted) {
      // Uncomplete the task
      setLoading(true);
      try {
        await uncompleteTask(task.id);
        toast.success("Task marked as incomplete");
      } catch {
        toast.error("Failed to uncomplete task");
      } finally {
        setLoading(false);
      }
    } else if (requiresEvidence) {
      // Show completion dialog only if evidence is required
      setCompleteDialogOpen(true);
    } else {
      // Complete immediately without dialog if no evidence required
      setLoading(true);
      try {
        await completeTask(task.id);
        toast.success("Task completed!");
      } catch {
        toast.error("Failed to complete task");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCompleteWithEvidence = async () => {
    setUploading(true);
    try {
      let evidenceUrl: string | undefined;

      // Upload evidence if provided
      if (evidenceFile) {
        const formData = new FormData();
        formData.append("file", evidenceFile);
        const uploadResult = await uploadTaskEvidence(formData);
        evidenceUrl = uploadResult.url;
      }

      await completeTask(task.id, {
        evidenceNotes: evidenceNotes || undefined,
        evidenceUrl,
      });

      toast.success("Task completed!");
      setCompleteDialogOpen(false);
      clearEvidence();
      setEvidenceNotes("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to complete task");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setLoading(true);
    try {
      await deleteTask(task.id);
      toast.success("Task deleted");
    } catch (error) {
      toast.error("Failed to delete task");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    setAssigning(true);
    try {
      await assignTask(task.id, selectedAssignee || null);
      toast.success(selectedAssignee ? "Task assigned successfully" : "Task unassigned");
      setAssignDialogOpen(false);
    } catch (error) {
      toast.error("Failed to assign task");
    } finally {
      setAssigning(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className={`${isOverdue ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30" : ""} ${isCompleted ? "opacity-75" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={handleToggleComplete}
              disabled={loading}
              className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                isCompleted
                  ? "bg-green-500 border-green-500 text-white hover:bg-green-600 cursor-pointer"
                  : "border-slate-300 dark:border-slate-600 hover:border-blue-500 cursor-pointer"
              }`}
              title={isCompleted ? "Click to mark as incomplete" : "Click to mark as complete"}
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : isCompleted ? (
                <CheckCircle className="h-3 w-3" />
              ) : null}
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className={`font-medium ${isCompleted ? "line-through text-slate-500 dark:text-slate-500" : "text-slate-900 dark:text-white"}`}>
                  {task.title}
                </h3>
              </div>
              {task.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{task.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(task.dueDate), "MMM d, yyyy")}
                  {task.dueTime && ` at ${task.dueTime}`}
                </div>
                {requiresEvidence && (
                  <Badge variant="outline" className="text-xs">
                    <Camera className="h-3 w-3 mr-1" />
                    Photo Required
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Evidence indicator */}
            {task.evidenceUrl && (
              <button
                onClick={() => setEvidenceDialogOpen(true)}
                className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-900 transition-colors"
                title="View evidence photo"
              >
                <ImageIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
              </button>
            )}
            {assignedTo && (
              <Avatar className="h-8 w-8" title={assignedTo.name || "Assigned"}>
                <AvatarFallback className="text-xs bg-slate-100 dark:bg-slate-800 dark:text-white">
                  {getInitials(assignedTo.name || "?")}
                </AvatarFallback>
              </Avatar>
            )}
            {getStatusBadge(task.status)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleToggleComplete}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isCompleted ? "Mark Incomplete" : "Mark Complete"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAssignDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {assignedTo ? "Reassign" : "Assign"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Task</DialogTitle>
            <DialogDescription>
              Assign &quot;{task.title}&quot; to a team member
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="assignee">Team Member</Label>
            <Select
              value={selectedAssignee || "unassigned"}
              onValueChange={(value) => setSelectedAssignee(value === "unassigned" ? "" : value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select team member..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name || member.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={assigning}>
              {assigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedAssignee ? "Assign" : "Unassign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Task Dialog with Photo Upload */}
      <Dialog open={completeDialogOpen} onOpenChange={(open) => {
        setCompleteDialogOpen(open);
        if (!open) {
          clearEvidence();
          setEvidenceNotes("");
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
            <DialogDescription>
              {requiresEvidence
                ? "Upload a photo as proof of completion"
                : "Optionally add a photo as evidence"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Photo Upload Area */}
            <div className="space-y-2">
              <Label>Evidence Photo {requiresEvidence && <span className="text-red-500">*</span>}</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              {evidencePreview ? (
                <div className="relative">
                  <Image
                    src={evidencePreview}
                    alt="Evidence preview"
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <button
                    onClick={clearEvidence}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                >
                  <Camera className="h-8 w-8 text-slate-400" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Tap to take photo or upload
                  </span>
                </button>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="evidence-notes">Notes (optional)</Label>
              <Textarea
                id="evidence-notes"
                placeholder="Any additional notes about this task..."
                value={evidenceNotes}
                onChange={(e) => setEvidenceNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setCompleteDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompleteWithEvidence}
              disabled={uploading || (requiresEvidence && !evidenceFile)}
              className="w-full sm:w-auto"
            >
              {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Evidence Dialog */}
      <Dialog open={evidenceDialogOpen} onOpenChange={setEvidenceDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Task Evidence</DialogTitle>
            <DialogDescription>
              Photo evidence for &quot;{task.title}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {task.evidenceUrl && (
              <Image
                src={task.evidenceUrl}
                alt="Task evidence"
                width={600}
                height={400}
                className="w-full rounded-lg"
              />
            )}
            {task.completedAt && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
                Completed on {format(new Date(task.completedAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEvidenceDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
