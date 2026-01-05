"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  Clock,
  Camera,
  Loader2,
  ImageIcon,
  X,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { completeTask, uploadTaskEvidence } from "@/lib/actions/tasks";

type LogbookTask = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date;
  dueTime: string | null;
  status: string;
  completedAt: Date | null;
  evidenceUrl: string | null;
  evidenceNotes: string | null;
  User_Task_assignedToIdToUser?: { id: string; name: string | null } | null;
  User_Task_completedByIdToUser?: { id: string; name: string | null } | null;
  TaskTemplate?: {
    id: string;
    name: string;
    requiresEvidence: boolean;
    frequency: string;
    category: string | null;
  } | null;
};

function getFrequencyLabel(frequency: string) {
  switch (frequency) {
    case "MULTIPLE_DAILY":
      return "Multiple times daily";
    case "DAILY":
      return "Daily";
    case "WEEKLY":
      return "Weekly";
    case "MONTHLY":
      return "Monthly";
    default:
      return frequency;
  }
}

function LogbookTaskCard({ task }: { task: LogbookTask }) {
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCompleted = task.status === "COMPLETED" || task.status === "VERIFIED";
  const isOverdue = task.status === "OVERDUE";
  const requiresEvidence = task.TaskTemplate?.requiresEvidence ?? false;

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

  const handleComplete = async () => {
    setUploading(true);
    try {
      let evidenceUrl: string | undefined;

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

      toast.success("Task logged!");
      setCompleteDialogOpen(false);
      clearEvidence();
      setEvidenceNotes("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to log task");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Card
        className={`transition-all ${
          isCompleted
            ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
            : isOverdue
            ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
            : "hover:border-blue-300 dark:hover:border-blue-700"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              {/* Status Icon */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isOverdue
                    ? "bg-red-500 text-white"
                    : "bg-slate-100 dark:bg-slate-800"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : isOverdue ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <Clock className="h-5 w-5 text-slate-400" />
                )}
              </div>

              {/* Task Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    className={`font-medium ${
                      isCompleted
                        ? "text-green-800 dark:text-green-200"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {task.title}
                  </h3>
                  {requiresEvidence && (
                    <Badge variant="outline" className="text-xs">
                      <Camera className="h-3 w-3 mr-1" />
                      Photo
                    </Badge>
                  )}
                  {task.TaskTemplate?.category && (
                    <Badge variant="secondary" className="text-xs">
                      {task.TaskTemplate.category}
                    </Badge>
                  )}
                </div>
                {task.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {task.dueTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {task.dueTime}
                    </span>
                  )}
                  {task.TaskTemplate && (
                    <span>{getFrequencyLabel(task.TaskTemplate.frequency)}</span>
                  )}
                  {isCompleted && task.completedAt && (
                    <span className="text-green-600 dark:text-green-400">
                      Completed {format(new Date(task.completedAt), "h:mm a")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {task.evidenceUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEvidenceDialogOpen(true)}
                  className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/50"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              )}
              {!isCompleted && (
                <Button
                  onClick={() => setCompleteDialogOpen(true)}
                  size="sm"
                  className="gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Log
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complete Dialog */}
      <Dialog
        open={completeDialogOpen}
        onOpenChange={(open) => {
          setCompleteDialogOpen(open);
          if (!open) {
            clearEvidence();
            setEvidenceNotes("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Task Completion</DialogTitle>
            <DialogDescription>
              {requiresEvidence
                ? "Take a photo as proof of completion"
                : "Optionally add a photo as evidence"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>
                Evidence Photo{" "}
                {requiresEvidence && <span className="text-red-500">*</span>}
              </Label>
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
                  className="w-full h-40 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex flex-col items-center justify-center gap-3 hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-slate-50 dark:bg-slate-900"
                >
                  <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <Camera className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Tap to take photo
                  </span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any comments about this task..."
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
              onClick={handleComplete}
              disabled={uploading || (requiresEvidence && !evidenceFile)}
              className="w-full sm:w-auto gap-2"
            >
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              <CheckCircle className="h-4 w-4" />
              Log Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Evidence Dialog */}
      <Dialog open={evidenceDialogOpen} onOpenChange={setEvidenceDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Task Evidence</DialogTitle>
            <DialogDescription>{task.title}</DialogDescription>
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
            {task.evidenceNotes && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
                <strong>Notes:</strong> {task.evidenceNotes}
              </p>
            )}
            {task.completedAt && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Completed on{" "}
                {format(new Date(task.completedAt), "MMM d, yyyy 'at' h:mm a")}
                {task.User_Task_completedByIdToUser?.name && (
                  <> by {task.User_Task_completedByIdToUser.name}</>
                )}
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
    </>
  );
}

export function LogbookTaskList({ tasks }: { tasks: LogbookTask[] }) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ClipboardCheck className="h-12 w-12 mx-auto text-slate-400 mb-4" />
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            No tasks scheduled for today
          </p>
          <p className="text-sm text-slate-500">
            Create task templates to automatically generate daily tasks
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group tasks by category
  const groupedTasks = tasks.reduce(
    (acc, task) => {
      const category = task.TaskTemplate?.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(task);
      return acc;
    },
    {} as Record<string, LogbookTask[]>
  );

  // Sort categories (Other at the end)
  const sortedCategories = Object.keys(groupedTasks).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      {sortedCategories.map((category) => (
        <div key={category}>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {category}
            </h2>
            <Badge variant="secondary">
              {groupedTasks[category].filter(t => t.status === "COMPLETED").length}/
              {groupedTasks[category].length}
            </Badge>
          </div>
          <div className="space-y-3">
            {groupedTasks[category].map((task) => (
              <LogbookTaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ClipboardCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  );
}
