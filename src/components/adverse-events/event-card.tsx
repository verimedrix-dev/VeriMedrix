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
  AlertTriangle,
  Calendar,
  MoreHorizontal,
  Loader2,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Shield,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  startEventInvestigation,
  recordEventFindings,
  recordCorrectiveAction,
  recordPatientOutcome,
  reportToAuthority,
  closeAdverseEvent,
  deleteAdverseEvent,
} from "@/lib/actions/adverse-events";
import { AdverseEventCategory, AdverseEventSeverity, PatientOutcome, EventStatus } from "@prisma/client";

const CATEGORY_LABELS: Record<AdverseEventCategory, string> = {
  MEDICATION_ERROR: "Medication Error",
  PROCEDURE_COMPLICATION: "Procedure Complication",
  DIAGNOSTIC_ERROR: "Diagnostic Error",
  EQUIPMENT_FAILURE: "Equipment Failure",
  FALL: "Patient Fall",
  INFECTION: "Healthcare Infection",
  ALLERGIC_REACTION: "Allergic Reaction",
  NEEDLE_STICK: "Needle Stick",
  OTHER: "Other",
};

const SEVERITY_CONFIG: Record<AdverseEventSeverity, { label: string; className: string }> = {
  NEAR_MISS: { label: "Near Miss", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" },
  MINOR: { label: "Minor", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" },
  MODERATE: { label: "Moderate", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100" },
  SEVERE: { label: "Severe", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" },
};

const STATUS_CONFIG: Record<EventStatus, { label: string; icon: React.ReactNode; className: string }> = {
  REPORTED: {
    label: "Reported",
    icon: <FileText className="h-3 w-3 mr-1" />,
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  },
  INVESTIGATING: {
    label: "Investigating",
    icon: <Search className="h-3 w-3 mr-1" />,
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  },
  ACTION_TAKEN: {
    label: "Action Taken",
    icon: <CheckCircle className="h-3 w-3 mr-1" />,
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  },
  CLOSED: {
    label: "Closed",
    icon: <XCircle className="h-3 w-3 mr-1" />,
    className: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
  },
};

const OUTCOME_LABELS: Record<PatientOutcome, string> = {
  NO_HARM: "No Harm",
  MINOR_HARM: "Minor Harm",
  MODERATE_HARM: "Moderate Harm",
  SEVERE_HARM: "Severe Harm",
  DEATH: "Death",
};

type AdverseEvent = {
  id: string;
  referenceNumber: string;
  eventDate: Date;
  patientInitials: string | null;
  patientFileNumber: string | null;
  category: AdverseEventCategory;
  severity: AdverseEventSeverity;
  description: string;
  status: EventStatus;
  investigatedBy: string | null;
  investigationDate: Date | null;
  findings: string | null;
  rootCause: string | null;
  correctiveAction: string | null;
  preventionPlan: string | null;
  actionImplementedDate: Date | null;
  actionVerifiedBy: string | null;
  patientOutcome: PatientOutcome | null;
  reportedToAuthority: boolean;
  authorityReportDate: Date | null;
  createdAt: Date;
};

export function EventCard({ event }: { event: AdverseEvent }) {
  const [loading, setLoading] = useState(false);
  const [investigateDialogOpen, setInvestigateDialogOpen] = useState(false);
  const [findingsDialogOpen, setFindingsDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [outcomeDialogOpen, setOutcomeDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [investigatedBy, setInvestigatedBy] = useState("");
  const [findings, setFindings] = useState(event.findings || "");
  const [rootCause, setRootCause] = useState(event.rootCause || "");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [preventionPlan, setPreventionPlan] = useState("");
  const [patientOutcome, setPatientOutcome] = useState<PatientOutcome | "">("");

  const isSevere = event.severity === "SEVERE";

  const handleStartInvestigation = async () => {
    if (!investigatedBy) {
      toast.error("Please enter who is investigating");
      return;
    }
    setLoading(true);
    try {
      await startEventInvestigation(event.id, investigatedBy);
      toast.success("Investigation started");
      setInvestigateDialogOpen(false);
    } catch {
      toast.error("Failed to start investigation");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordFindings = async () => {
    if (!findings) {
      toast.error("Please enter investigation findings");
      return;
    }
    setLoading(true);
    try {
      await recordEventFindings(event.id, {
        findings,
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

  const handleRecordAction = async () => {
    if (!correctiveAction) {
      toast.error("Please enter corrective action taken");
      return;
    }
    setLoading(true);
    try {
      await recordCorrectiveAction(event.id, {
        correctiveAction,
        preventionPlan: preventionPlan || undefined,
      });
      toast.success("Corrective action recorded");
      setActionDialogOpen(false);
    } catch {
      toast.error("Failed to record action");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordOutcome = async () => {
    if (!patientOutcome) {
      toast.error("Please select patient outcome");
      return;
    }
    setLoading(true);
    try {
      await recordPatientOutcome(event.id, patientOutcome as PatientOutcome);
      toast.success("Patient outcome recorded");
      setOutcomeDialogOpen(false);
    } catch {
      toast.error("Failed to record outcome");
    } finally {
      setLoading(false);
    }
  };

  const handleReportToAuthority = () => {
    setReportDialogOpen(true);
  };

  const confirmReportToAuthority = async () => {
    setLoading(true);
    try {
      await reportToAuthority(event.id);
      toast.success("Marked as reported to authority");
      setReportDialogOpen(false);
    } catch {
      toast.error("Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    setLoading(true);
    try {
      await closeAdverseEvent(event.id);
      toast.success("Event closed");
    } catch {
      toast.error("Failed to close event");
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
      await deleteAdverseEvent(event.id);
      toast.success("Event deleted");
      setDeleteDialogOpen(false);
    } catch {
      toast.error("Failed to delete event");
    } finally {
      setDeleting(false);
    }
  };

  const statusConfig = STATUS_CONFIG[event.status];
  const severityConfig = SEVERITY_CONFIG[event.severity];

  return (
    <>
      <Card className={`${isSevere ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm text-slate-500 dark:text-slate-400">
                  {event.referenceNumber}
                </span>
                <Badge className={severityConfig.className}>{severityConfig.label}</Badge>
                <Badge variant="outline">{CATEGORY_LABELS[event.category]}</Badge>
                {isSevere && !event.reportedToAuthority && (
                  <Badge variant="destructive" className="animate-pulse">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Report Required
                  </Badge>
                )}
              </div>

              <h3 className="font-medium text-slate-900 dark:text-white mt-2 line-clamp-2">
                {event.description}
              </h3>

              <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(event.eventDate), "MMM d, yyyy")}
                </div>
                {event.patientInitials && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {event.patientInitials}
                  </div>
                )}
                {event.patientOutcome && (
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    {OUTCOME_LABELS[event.patientOutcome]}
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
                    <FileText className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {event.status === "REPORTED" && (
                    <DropdownMenuItem onClick={() => setInvestigateDialogOpen(true)}>
                      <Search className="h-4 w-4 mr-2" />
                      Start Investigation
                    </DropdownMenuItem>
                  )}
                  {event.status === "INVESTIGATING" && (
                    <>
                      <DropdownMenuItem onClick={() => setFindingsDialogOpen(true)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Record Findings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setActionDialogOpen(true)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Record Corrective Action
                      </DropdownMenuItem>
                    </>
                  )}
                  {!event.patientOutcome && event.status !== "CLOSED" && (
                    <DropdownMenuItem onClick={() => setOutcomeDialogOpen(true)}>
                      <Activity className="h-4 w-4 mr-2" />
                      Record Patient Outcome
                    </DropdownMenuItem>
                  )}
                  {isSevere && !event.reportedToAuthority && (
                    <DropdownMenuItem onClick={handleReportToAuthority}>
                      <Shield className="h-4 w-4 mr-2" />
                      Mark Reported to Authority
                    </DropdownMenuItem>
                  )}
                  {event.status === "ACTION_TAKEN" && (
                    <DropdownMenuItem onClick={handleClose} disabled={loading}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Close Event
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
            <DialogTitle>{event.referenceNumber}</DialogTitle>
            <DialogDescription>Adverse Event Details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Event Date</p>
                <p className="font-medium">{format(new Date(event.eventDate), "PPP")}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Status</p>
                <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Category</p>
                <p className="font-medium">{CATEGORY_LABELS[event.category]}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Severity</p>
                <Badge className={severityConfig.className}>{severityConfig.label}</Badge>
              </div>
            </div>

            {(event.patientInitials || event.patientFileNumber) && (
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Patient</p>
                <p className="font-medium">
                  {event.patientInitials}
                  {event.patientFileNumber && ` (File: ${event.patientFileNumber})`}
                </p>
              </div>
            )}

            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Description</p>
              <p className="whitespace-pre-wrap text-sm">{event.description}</p>
            </div>

            {event.investigatedBy && (
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Investigated By</p>
                <p className="font-medium">{event.investigatedBy}</p>
                {event.investigationDate && (
                  <p className="text-xs text-slate-500">on {format(new Date(event.investigationDate), "PPP")}</p>
                )}
              </div>
            )}

            {event.findings && (
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Findings</p>
                <p className="whitespace-pre-wrap text-sm">{event.findings}</p>
              </div>
            )}

            {event.rootCause && (
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Root Cause</p>
                <p className="whitespace-pre-wrap text-sm">{event.rootCause}</p>
              </div>
            )}

            {event.correctiveAction && (
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Corrective Action</p>
                <p className="whitespace-pre-wrap text-sm">{event.correctiveAction}</p>
              </div>
            )}

            {event.preventionPlan && (
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Prevention Plan</p>
                <p className="whitespace-pre-wrap text-sm">{event.preventionPlan}</p>
              </div>
            )}

            {event.patientOutcome && (
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Patient Outcome</p>
                <Badge variant="outline">{OUTCOME_LABELS[event.patientOutcome]}</Badge>
              </div>
            )}

            {event.reportedToAuthority && (
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Reported to Authority</p>
                <p className="font-medium text-green-600">
                  Yes {event.authorityReportDate && `- ${format(new Date(event.authorityReportDate), "PPP")}`}
                </p>
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
            <DialogDescription>Who will be investigating this event?</DialogDescription>
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
              <Label htmlFor="findings">Investigation Findings *</Label>
              <Textarea
                id="findings"
                placeholder="What did the investigation reveal?"
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rootCause">Root Cause (optional)</Label>
              <Textarea
                id="rootCause"
                placeholder="What caused this event?"
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

      {/* Record Corrective Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Corrective Action</DialogTitle>
            <DialogDescription>Document what actions were taken to address this event.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="correctiveAction">Corrective Action Taken *</Label>
              <Textarea
                id="correctiveAction"
                placeholder="What was done to address this event?"
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preventionPlan">Prevention Plan (optional)</Label>
              <Textarea
                id="preventionPlan"
                placeholder="How will similar events be prevented in the future?"
                value={preventionPlan}
                onChange={(e) => setPreventionPlan(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordAction} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Patient Outcome Dialog */}
      <Dialog open={outcomeDialogOpen} onOpenChange={setOutcomeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Patient Outcome</DialogTitle>
            <DialogDescription>What was the outcome for the patient?</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="patientOutcome">Patient Outcome</Label>
            <Select
              value={patientOutcome}
              onValueChange={(value) => setPatientOutcome(value as PatientOutcome)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select outcome..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(OUTCOME_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOutcomeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordOutcome} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Outcome
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report to Authority Confirmation Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Report to Authority</DialogTitle>
            <DialogDescription>
              This will record that this event has been reported to the relevant authority. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setReportDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReportToAuthority}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Shield className="h-4 w-4 mr-2" />
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
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
