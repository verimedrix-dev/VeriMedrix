"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { completeTask, uncompleteTask, deleteTask, assignTask, getPracticeTeamMembers } from "@/lib/actions/tasks";
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
  User_Task_assignedToIdToUser?: { id: string; name: string | null } | null;
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
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>(
    task.User_Task_assignedToIdToUser?.id || ""
  );
  const [assigning, setAssigning] = useState(false);

  const isOverdue = task.status === "OVERDUE";
  const isCompleted = task.status === "COMPLETED" || task.status === "VERIFIED";
  const assignedTo = task.User_Task_assignedToIdToUser;

  // Load team members when assign dialog opens
  useEffect(() => {
    if (assignDialogOpen) {
      getPracticeTeamMembers().then(setTeamMembers);
    }
  }, [assignDialogOpen]);

  const handleToggleComplete = async () => {
    setLoading(true);
    try {
      if (isCompleted) {
        await uncompleteTask(task.id);
        toast.success("Task marked as incomplete");
      } else {
        await completeTask(task.id);
        toast.success("Task marked as complete!");
      }
    } catch (error) {
      toast.error(isCompleted ? "Failed to uncomplete task" : "Failed to complete task");
    } finally {
      setLoading(false);
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
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
    </Card>
  );
}
