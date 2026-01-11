import nextDynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Search,
} from "lucide-react";
import { getComplaintsPageData } from "@/lib/actions/complaints";
import { ComplaintCard } from "@/components/complaints/complaint-card";

export const dynamic = "force-dynamic";

const CreateComplaintDialog = nextDynamic(
  () => import("@/components/complaints/create-complaint-dialog").then((mod) => mod.CreateComplaintDialog),
  { loading: () => <Skeleton className="h-10 w-32" /> }
);

export default async function ComplaintsPage() {
  const data = await getComplaintsPageData();
  const complaints = data?.complaints || [];
  const stats = data?.stats;

  const receivedComplaints = complaints.filter((c) => c.status === "RECEIVED");
  const acknowledgedComplaints = complaints.filter((c) => c.status === "ACKNOWLEDGED");
  const investigatingComplaints = complaints.filter((c) => c.status === "INVESTIGATING");
  const resolvedComplaints = complaints.filter((c) => c.status === "RESOLVED");
  const closedComplaints = complaints.filter((c) => c.status === "CLOSED");
  const openComplaints = complaints.filter((c) => !["RESOLVED", "CLOSED"].includes(c.status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Complaints Register</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            OHSC Non-Negotiable #5: Track and resolve patient complaints
          </p>
        </div>
        <CreateComplaintDialog />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {(stats?.overdueAcknowledgement ?? 0) > 0 && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats?.overdueAcknowledgement ?? 0}</p>
                  <p className="text-xs text-red-600 dark:text-red-400">Overdue Ack.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats?.received || 0}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Received</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats?.acknowledged || 0}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Acknowledged</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/50">
                <Search className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{stats?.investigating || 0}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Investigating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats?.resolved || 0}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                <XCircle className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-700 dark:text-white">{stats?.closed || 0}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Closed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* OHSC Reminder */}
      <Card className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
        <CardContent className="py-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>OHSC Requirement:</strong> All complaints must be acknowledged within 5 working days
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Complaints Tabs */}
      <Tabs defaultValue="open" className="space-y-4">
        <TabsList>
          <TabsTrigger value="open">
            Open
            <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
              {openComplaints.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="received">
            Received
            <Badge variant="secondary" className="ml-2">
              {receivedComplaints.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="investigating">
            Investigating
            <Badge className="ml-2 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
              {investigatingComplaints.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved
            <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              {resolvedComplaints.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="all">
            All
            <Badge variant="secondary" className="ml-2">
              {complaints.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-3">
          {openComplaints.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-slate-600 dark:text-slate-400 mb-2">No open complaints</p>
                <p className="text-sm text-slate-500">All complaints have been resolved or closed</p>
              </CardContent>
            </Card>
          ) : (
            openComplaints.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} />
            ))
          )}
        </TabsContent>

        <TabsContent value="received" className="space-y-3">
          {receivedComplaints.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500 dark:text-slate-400">
                <MessageSquare className="h-12 w-12 mx-auto text-slate-400 mb-3" />
                <p>No complaints awaiting acknowledgement</p>
              </CardContent>
            </Card>
          ) : (
            receivedComplaints.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} />
            ))
          )}
        </TabsContent>

        <TabsContent value="investigating" className="space-y-3">
          {investigatingComplaints.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500 dark:text-slate-400">
                <Search className="h-12 w-12 mx-auto text-slate-400 mb-3" />
                <p>No complaints under investigation</p>
              </CardContent>
            </Card>
          ) : (
            investigatingComplaints.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} />
            ))
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-3">
          {resolvedComplaints.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500 dark:text-slate-400">
                <CheckCircle className="h-12 w-12 mx-auto text-slate-400 mb-3" />
                <p>No resolved complaints</p>
              </CardContent>
            </Card>
          ) : (
            resolvedComplaints.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} />
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-3">
          {complaints.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <p className="text-slate-600 dark:text-slate-400 mb-2">No complaints logged</p>
                <p className="text-sm text-slate-500">Click &quot;Log Complaint&quot; to record a patient complaint</p>
              </CardContent>
            </Card>
          ) : (
            complaints.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
