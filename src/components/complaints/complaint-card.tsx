"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  MoreHorizontal,
  Loader2,
  Trash2,
  Search,
  MessageSquare,
  XCircle,
  User,
  Phone,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import {
  acknowledgeComplaint,
  startInvestigation,
  recordInvestigationFindings,
  resolveComplaint,
  closeComplaint,
  deleteComplaint,
} from "@/lib/actions/complaints";
import { ComplaintStatus, ComplaintCategory, Severity, ResolutionType } from "@prisma/client";

const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  SERVICE: "Service",
  STAFF: "Staff",
  BILLING: "Billing",
  FACILITIES: "Facilities",
  WAITING_TIME: "Wait Time",
  OTHER: "Other",
};

const SEVERITY_CONFIG: Record<Severity, { label: string; className: string }> = {
  LOW: { label: "Low", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" },
  MEDIUM: { label: "Medium", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" },
  HIGH: { label: "High", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" },
};

const STATUS_CONFIG: Record<ComplaintStatus, { label: string; icon: React.ReactNode; className: string }> = {
  RECEIVED: {
    label: "Received",
    icon: <MessageSquare className="h-3 w-3 mr-1" />,
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  },
  ACKNOWLEDGED: {
    label: "Acknowledged",
    icon: <CheckCircle className="h-3 w-3 mr-1" />,
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  },
  INVESTIGATING: {
    label: "Investigating",
    icon: <Search className="h-3 w-3 mr-1" />,
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  },
  RESOLVED: {
    label: "Resolved",
    icon: <CheckCircle className="h-3 w-3 mr-1" />,
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  },
  CLOSED: {
    label: "Closed",
    icon: <XCircle className="h-3 w-3 mr-1" />,
    className: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
  },
};

const RESOLUTION_LABELS: Record<ResolutionType, string> = {
  APOLOGY: "Apology",
  EXPLANATION: "Explanation",
  REMEDIAL_ACTION: "Remedial Action",
  POLICY_CHANGE: "Policy Change",
  TRAINING: "Training Provided",
  REFUND: "Refund",
  OTHER: "Other",
};

type Complaint = {
  id: string;
  referenceNumber: string;
  dateReceived: Date;
  complainantName: string | null;
  complainantContact: string | null;
  category: ComplaintCategory;
  severity: Severity;
  summary: string;
  details: string | null;
  status: ComplaintStatus;
  investigatedBy: string | null;
  investigationNotes: string | null;
  rootCause: string | null;
  resolutionSummary: string | null;
  resolutionType: ResolutionType | null;
  acknowledgedAt: Date | null;
  resolvedAt: Date | null;
  createdAt: Date;
};

export function ComplaintCard({ complaint }: { complaint: Complaint }) {
  const [loading, setLoading] = useState(false);
  const [investigateDialogOpen, setInvestigateDialogOpen] = useState(false);
  const [findingsDialogOpen, setFindingsDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [investigatedBy, setInvestigatedBy] = useState("");
  const [investigationNotes, setInvestigationNotes] = useState(complaint.investigationNotes || "");
  const [rootCause, setRootCause] = useState(complaint.rootCause || "");
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [resolutionType, setResolutionType] = useState<ResolutionType | "">("");

  const daysSinceReceived = differenceInDays(new Date(), new Date(complaint.dateReceived));
  const isOverdueAcknowledgement = complaint.status === "RECEIVED" && daysSinceReceived > 5;

  const handleAcknowledge = async () => {
    setLoading(true);
    try {
      await acknowledgeComplaint(complaint.id);
      toast.success("Complaint acknowledged");
    } catch {
      toast.error("Failed to acknowledge complaint");
    } finally {
      setLoading(false);
    }
  };

  const handleStartInvestigation = async () => {
    if (!investigatedBy) {
      toast.error("Please enter who is investigating");
      return;
    }
    setLoading(true);
    try {
      await startInvestigation(complaint.id, investigatedBy);
      toast.success("Investigation started");
      setInvestigateDialogOpen(false);
    } catch {
      toast.error("Failed to start investigation");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordFindings = async () => {
    if (!investigationNotes) {
      toast.error("Please enter investigation notes");
      return;
    }
    setLoading(true);
    try {
      await recordInvestigationFindings(complaint.id, {
        investigationNotes,
        rootCause: rootCause || undefined,
      });
      toast.success("Findings recorded");
      setFindingsDialogOpen(false);
    } catch {
      toast.error("Failed to record findings");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!resolutionSummary || !resolutionType) {
      toast.error("Please fill in resolution details");
      return;
    }
    setLoading(true);
    try {
      await resolveComplaint(complaint.id, {
        resolutionSummary,
        resolutionType: resolutionType as ResolutionType,
      });
      toast.success("Complaint resolved");
      setResolveDialogOpen(false);
    } catch {
      toast.error("Failed to resolve complaint");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    setLoading(true);
    try {
      await closeComplaint(complaint.id);
      toast.success("Complaint closed");
    } catch {
      toast.error("Failed to close complaint");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteComplaint(complaint.id);
      toast.success("Complaint deleted");
      setDeleteDialogOpen(false);
    } catch {
      toast.error("Failed to delete complaint");
    } finally {
      setDeleting(false);
    }
  };

  const statusConfig = STATUS_CONFIG[complaint.status];
  const severityConfig = SEVERITY_CONFIG[complaint.severity];

  return (
    <>
      <Card className={`${isOverdueAcknowledgement ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm text-slate-500 dark:text-slate-400">
                  {complaint.referenceNumber}
                </span>
                <Badge className={severityConfig.className}>{severityConfig.label}</Badge>
                <Badge variant="outline">{CATEGORY_LABELS[complaint.category]}</Badge>
                {isOverdueAcknowledgement && (
                  <Badge variant="destructive" className="animate-pulse">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Overdue Acknowledgement
                  </Badge>
                )}
              </div>

              <h3 className="font-medium text-slate-900 dark:text-white mt-2 truncate">
                {complaint.summary}
              </h3>

              <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(complaint.dateReceived), "MMM d, yyyy")}
                </div>
                {complaint.complainantName && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {complaint.complainantName}
                  </div>
                )}
                {complaint.complainantContact && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {complaint.complainantContact}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge className={statusConfig.className}>
                {statusConfig.icon}
                {statusConfig.label}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setDetailsDialogOpen(true)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {complaint.status === "RECEIVED" && (
                    <DropdownMenuItem onClick={handleAcknowledge} disabled={loading}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Acknowledge
                    </DropdownMenuItem>
                  )}
                  {complaint.status === "ACKNOWLEDGED" && (
                    <DropdownMenuItem onClick={() => setInvestigateDialogOpen(true)}>
                      <Search className="h-4 w-4 mr-2" />
                      Start Investigation
                    </DropdownMenuItem>
                  )}
                  {complaint.status === "INVESTIGATING" && (
                    <>
                      <DropdownMenuItem onClick={() => setFindingsDialogOpen(true)}>
                        <Clock className="h-4 w-4 mr-2" />
                        Record Findings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setResolveDialogOpen(true)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Resolve
                      </DropdownMenuItem>
                    </>
                  )}
                  {complaint.status === "RESOLVED" && (
                    <DropdownMenuItem onClick={handleClose} disabled={loading}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Close Complaint
                    </DropdownMenuItem>
                  )}
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
      </Card>

      {/* View Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{complaint.referenceNumber}</DialogTitle>
            <DialogDescription>{complaint.summary}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Date Received</p>
                <p className="font-medium">{format(new Date(complaint.dateReceived), "PPP")}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Status</p>
                <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Category</p>
                <p className="font-medium">{CATEGORY_LABELS[complaint.category]}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Severity</p>
                <Badge className={severityConfig.className}>{severityConfig.label}</Badge>
              </div>
            </div>

            {complaint.complainantName && (
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Complainant</p>
                <p className="font-medium">{complaint.complainantName}</p>
                {complaint.complainantContact && (
                  <p className="text-sm text-slate-600">{complaint.complainantContact}</p>
                )}
              </div>
            )}

            {complaint.details && (
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Details</p>
                <p className="whitespace-pre-wrap text-sm">{complaint.details}</p>
              </div>
            )}

            {complaint.acknowledgedAt && (
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Acknowledged</p>
                <p className="font-medium">{format(new Date(complaint.acknowledgedAt), "PPP")}</p>
              </div>
            )}

            {complaint.investigatedBy && (
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Investigated By</p>
                <p className="font-medium">{complaint.investigatedBy}</p>
              </div>
            )}

            {complaint.investigationNotes && (
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Investigation Notes</p>
                <p className="whitespace-pre-wrap text-sm">{complaint.investigationNotes}</p>
              </div>
            )}

            {complaint.rootCause && (
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Root Cause</p>
                <p className="whitespace-pre-wrap text-sm">{complaint.rootCause}</p>
              </div>
            )}

            {complaint.resolutionSummary && (
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Resolution</p>
                <p className="whitespace-pre-wrap text-sm">{complaint.resolutionSummary}</p>
                {complaint.resolutionType && (
                  <Badge variant="outline" className="mt-1">
                    {RESOLUTION_LABELS[complaint.resolutionType]}
                  </Badge>
                )}
              </div>
            )}

            {complaint.resolvedAt && (
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Resolved</p>
                <p className="font-medium">{format(new Date(complaint.resolvedAt), "PPP")}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Start Investigation Dialog */}
      <Dialog open={investigateDialogOpen} onOpenChange={setInvestigateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Investigation</DialogTitle>
            <DialogDescription>Who will be investigating this complaint?</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="investigatedBy">Investigator Name</Label>
            <Input
              id="investigatedBy"
              placeholder="e.g., Dr. Smith"
              value={investigatedBy}
              onChange={(e) => setInvestigatedBy(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvestigateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStartInvestigation} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Start Investigation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Findings Dialog */}
      <Dialog open={findingsDialogOpen} onOpenChange={setFindingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Investigation Findings</DialogTitle>
            <DialogDescription>Document what was found during the investigation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="investigationNotes">Investigation Notes *</Label>
              <Textarea
                id="investigationNotes"
                placeholder="What did the investigation reveal?"
                value={investigationNotes}
                onChange={(e) => setInvestigationNotes(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rootCause">Root Cause (optional)</Label>
              <Textarea
                id="rootCause"
                placeholder="What caused this issue?"
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFindingsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordFindings} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Findings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Complaint</DialogTitle>
            <DialogDescription>Record how this complaint was resolved.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resolutionType">Resolution Type *</Label>
              <Select
                value={resolutionType}
                onValueChange={(value) => setResolutionType(value as ResolutionType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How was this resolved?" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RESOLUTION_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resolutionSummary">Resolution Summary *</Label>
              <Textarea
                id="resolutionSummary"
                placeholder="Describe what was done to resolve this complaint..."
                value={resolutionSummary}
                onChange={(e) => setResolutionSummary(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Mark Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Complaint</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this complaint? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
              className="w-full sm:w-auto"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
