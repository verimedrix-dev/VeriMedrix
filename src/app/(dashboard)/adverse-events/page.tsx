import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Activity,
  Shield,
} from "lucide-react";
import { getAdverseEventsPageData } from "@/lib/actions/adverse-events";
import { EventCard } from "@/components/adverse-events/event-card";

const CreateEventDialog = dynamic(
  () => import("@/components/adverse-events/create-event-dialog").then((mod) => mod.CreateEventDialog),
  { loading: () => <Skeleton className="h-10 w-32" /> }
);

export default async function AdverseEventsPage() {
  const data = await getAdverseEventsPageData();
  const events = data?.events || [];
  const stats = data?.stats;

  const reportedEvents = events.filter((e) => e.status === "REPORTED");
  const investigatingEvents = events.filter((e) => e.status === "INVESTIGATING");
  const actionTakenEvents = events.filter((e) => e.status === "ACTION_TAKEN");
  const closedEvents = events.filter((e) => e.status === "CLOSED");
  const openEvents = events.filter((e) => e.status !== "CLOSED");
  const severeUnreported = events.filter((e) => e.severity === "SEVERE" && !e.reportedToAuthority);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Adverse Events Register</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            OHSC Non-Negotiable #10: Track and manage patient safety incidents
          </p>
        </div>
        <CreateEventDialog />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {(stats?.severe ?? 0) > 0 && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats?.severe ?? 0}</p>
                  <p className="text-xs text-red-600 dark:text-red-400">Severe Events</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats?.reported || 0}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Reported</p>
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
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats?.actionTaken || 0}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Action Taken</p>
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
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats?.nearMiss || 0}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Near Misses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Severe Events Warning */}
      {severeUnreported.length > 0 && (
        <Card className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Alert:</strong> {severeUnreported.length} severe event{severeUnreported.length !== 1 ? "s" : ""} may need to be reported to the relevant authority
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events Tabs */}
      <Tabs defaultValue="open" className="space-y-4">
        <TabsList>
          <TabsTrigger value="open">
            Open
            <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
              {openEvents.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="reported">
            Reported
            <Badge variant="secondary" className="ml-2">
              {reportedEvents.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="investigating">
            Investigating
            <Badge className="ml-2 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
              {investigatingEvents.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="action-taken">
            Action Taken
            <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              {actionTakenEvents.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="all">
            All
            <Badge variant="secondary" className="ml-2">
              {events.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-3">
          {openEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-slate-600 dark:text-slate-400 mb-2">No open events</p>
                <p className="text-sm text-slate-500">All adverse events have been addressed</p>
              </CardContent>
            </Card>
          ) : (
            openEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          )}
        </TabsContent>

        <TabsContent value="reported" className="space-y-3">
          {reportedEvents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500 dark:text-slate-400">
                <FileText className="h-12 w-12 mx-auto text-slate-400 mb-3" />
                <p>No events awaiting investigation</p>
              </CardContent>
            </Card>
          ) : (
            reportedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          )}
        </TabsContent>

        <TabsContent value="investigating" className="space-y-3">
          {investigatingEvents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500 dark:text-slate-400">
                <Search className="h-12 w-12 mx-auto text-slate-400 mb-3" />
                <p>No events under investigation</p>
              </CardContent>
            </Card>
          ) : (
            investigatingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          )}
        </TabsContent>

        <TabsContent value="action-taken" className="space-y-3">
          {actionTakenEvents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500 dark:text-slate-400">
                <CheckCircle className="h-12 w-12 mx-auto text-slate-400 mb-3" />
                <p>No events with actions taken</p>
              </CardContent>
            </Card>
          ) : (
            actionTakenEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-3">
          {events.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <p className="text-slate-600 dark:text-slate-400 mb-2">No adverse events recorded</p>
                <p className="text-sm text-slate-500">Click &quot;Report Event&quot; to record a patient safety incident</p>
              </CardContent>
            </Card>
          ) : (
            events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
