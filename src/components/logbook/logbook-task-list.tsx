"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  Clock,
  Camera,
  Loader2,
  ImageIcon,
  X,
  AlertCircle,
  MoreHorizontal,
  Pencil,
  UserPlus,
  Trash2,
  User,
  FileText,
  Upload,
  PenLine,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { completeTask, uploadTaskEvidence, updateTask, assignTask, deleteTask, getPracticeTeamMembers } from "@/lib/actions/tasks";
import { SignaturePad } from "./signature-pad";

type TeamMember = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

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
  signatureUrl: string | null;
  photoCapturedAt: Date | null;
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

function LogbookTaskCard({ task, teamMembers }: { task: LogbookTask; teamMembers: TeamMember[] }) {
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [isImageFile, setIsImageFile] = useState(true);
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [photoCapturedAt, setPhotoCapturedAt] = useState<Date | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || "");
  const [editDueTime, setEditDueTime] = useState(task.dueTime || "");

  // Assign state
  const [selectedAssignee, setSelectedAssignee] = useState<string>(
    task.User_Task_assignedToIdToUser?.id || "unassigned"
  );

  const isCompleted = task.status === "COMPLETED" || task.status === "VERIFIED";
  const isOverdue = task.status === "OVERDUE";
  const requiresEvidence = task.TaskTemplate?.requiresEvidence ?? false;

  // Allowed file types for evidence
  const ALLOWED_TYPES = [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isCamera = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error("Please select an image, PDF, Word, or Excel file");
        return;
      }
      const isImage = file.type.startsWith("image/");
      const maxSize = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`File must be less than ${maxSize / (1024 * 1024)}MB`);
        return;
      }
      setEvidenceFile(file);
      setIsImageFile(isImage);

      // Record timestamp when photo is captured
      if (isImage) {
        setPhotoCapturedAt(new Date());
        const reader = new FileReader();
        reader.onloadend = () => {
          setEvidencePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setEvidencePreview(file.name);
      }
    }
  };

  const clearEvidence = () => {
    setEvidenceFile(null);
    setEvidencePreview(null);
    setIsImageFile(true);
    setPhotoCapturedAt(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  const handleComplete = async () => {
    setUploading(true);
    try {
      let evidenceUrl: string | undefined;
      let signatureUrl: string | undefined;

      if (evidenceFile) {
        const formData = new FormData();
        formData.append("file", evidenceFile);
        const uploadResult = await uploadTaskEvidence(formData);
        evidenceUrl = uploadResult.url;
      }

      // Upload signature if drawn
      if (signatureDataUrl) {
        const blob = await fetch(signatureDataUrl).then(r => r.blob());
        const sigFile = new File([blob], "signature.png", { type: "image/png" });
        const sigFormData = new FormData();
        sigFormData.append("file", sigFile);
        const sigResult = await uploadTaskEvidence(sigFormData);
        signatureUrl = sigResult.url;
      }

      await completeTask(task.id, {
        evidenceNotes: evidenceNotes || undefined,
        evidenceUrl,
        signatureUrl,
        photoCapturedAt: photoCapturedAt || undefined,
      });

      toast.success("Task logged!");
      setCompleteDialogOpen(false);
      clearEvidence();
      setEvidenceNotes("");
      setSignatureDataUrl(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to log task");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async () => {
    if (!editTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }

    setSaving(true);
    try {
      await updateTask(task.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        dueTime: editDueTime || undefined,
      });
      toast.success("Task updated!");
      setEditDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update task");
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async () => {
    setSaving(true);
    try {
      const assigneeId = selectedAssignee === "unassigned" ? null : selectedAssignee;
      await assignTask(task.id, assigneeId);
      const assigneeName = assigneeId
        ? teamMembers.find(m => m.id === assigneeId)?.name || "team member"
        : "no one";
      toast.success(`Task assigned to ${assigneeName}`);
      setAssignDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to assign task");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteTask(task.id);
      toast.success("Task deleted");
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete task");
    } finally {
      setDeleting(false);
    }
  };

  const openEditDialog = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditDueTime(task.dueTime || "");
    setEditDialogOpen(true);
  };

  const openAssignDialog = () => {
    setSelectedAssignee(task.User_Task_assignedToIdToUser?.id || "unassigned");
    setAssignDialogOpen(true);
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
                      <Upload className="h-3 w-3 mr-1" />
                      Evidence
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
                  {task.User_Task_assignedToIdToUser?.name && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {task.User_Task_assignedToIdToUser.name}
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
                  title="View Evidence"
                  className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/50"
                >
                  {/\.(jpg|jpeg|png|gif|webp)$/i.test(task.evidenceUrl) ? (
                    <ImageIcon className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
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

              {/* More Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={openEditDialog}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openAssignDialog}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign to
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                ? "Upload a photo or document as proof of completion"
                : "Optionally add a photo or document as evidence"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Photo / File Upload */}
            <div className="space-y-2">
              <Label>
                Evidence{" "}
                {requiresEvidence && <span className="text-red-500">*</span>}
              </Label>
              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleFileSelect(e, true)}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                onChange={(e) => handleFileSelect(e, false)}
                className="hidden"
              />
              {evidencePreview ? (
                <div className="relative">
                  {isImageFile ? (
                    <>
                      <Image
                        src={evidencePreview}
                        alt="Evidence preview"
                        width={400}
                        height={300}
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      {photoCapturedAt && (
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {format(photoCapturedAt, "MMM d, yyyy h:mm:ss a")}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-lg border flex flex-col items-center justify-center gap-2">
                      <FileText className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-400 px-4 text-center truncate max-w-full">
                        {evidencePreview}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={clearEvidence}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-green-500 dark:hover:border-green-400 transition-colors bg-slate-50 dark:bg-slate-900"
                    >
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                        <Camera className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Take Photo
                      </span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-slate-50 dark:bg-slate-900"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Upload File
                      </span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 text-center">
                    Images, PDF, Word, Excel (max 10MB)
                  </p>
                </div>
              )}
            </div>

            {/* Signature Pad */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <PenLine className="h-3.5 w-3.5" />
                Signature (optional)
              </Label>
              <SignaturePad onSignatureChange={setSignatureDataUrl} />
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the task details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editTitle">Title</Label>
              <Input
                id="editTitle"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Task title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDescription">Description (optional)</Label>
              <Textarea
                id="editDescription"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Task description..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDueTime">Due Time (optional)</Label>
              <Input
                id="editDueTime"
                type="time"
                value={editDueTime}
                onChange={(e) => setEditDueTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={saving || !editTitle.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Task</DialogTitle>
            <DialogDescription>
              Select a team member to assign this task to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Assign to</Label>
              <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team member" />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{task.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Evidence Dialog */}
      <Dialog open={evidenceDialogOpen} onOpenChange={setEvidenceDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Task Evidence</DialogTitle>
            <DialogDescription>{task.title}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {task.evidenceUrl && (
              (() => {
                // Check if it's an image based on URL extension
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(task.evidenceUrl);
                if (isImage) {
                  return (
                    <Image
                      src={task.evidenceUrl}
                      alt="Task evidence"
                      width={600}
                      height={400}
                      className="w-full rounded-lg"
                    />
                  );
                } else {
                  // Document file - show icon and download link
                  const fileName = task.evidenceUrl.split("/").pop() || "Document";
                  return (
                    <div className="flex flex-col items-center gap-4 py-6 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <FileText className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                      <p className="text-sm text-slate-600 dark:text-slate-400 text-center px-4 break-all">
                        {fileName}
                      </p>
                      <a
                        href={task.evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View / Download Document
                      </a>
                    </div>
                  );
                }
              })()
            )}
            {task.photoCapturedAt && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
                <strong>Photo captured:</strong>{" "}
                {format(new Date(task.photoCapturedAt), "MMM d, yyyy 'at' h:mm:ss a")}
              </p>
            )}
            {task.signatureUrl && (
              <div className="mt-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Signature:</p>
                <Image
                  src={task.signatureUrl}
                  alt="Signature"
                  width={300}
                  height={100}
                  className="border rounded-lg bg-white dark:bg-slate-900 p-2"
                />
              </div>
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
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    // Fetch team members for assignment dropdown
    getPracticeTeamMembers().then(setTeamMembers).catch(console.error);
  }, []);

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
              <LogbookTaskCard key={task.id} task={task} teamMembers={teamMembers} />
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
