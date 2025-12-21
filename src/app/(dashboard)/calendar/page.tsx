import dynamic from "next/dynamic";
import { getTasksForCalendar } from "@/lib/actions/tasks";
import { getDocumentsForCalendar } from "@/lib/actions/documents";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

// Dynamic import for calendar component (uses date-fns heavily)
const CalendarView = dynamic(
  () => import("@/components/calendar/calendar-view").then((mod) => mod.CalendarView),
  {
    loading: () => <CalendarLoadingSkeleton />,
  }
);

function CalendarLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-5 w-72 mt-1" />
      </div>
      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-40" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-9 w-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-20 mt-1" />
            </CardHeader>
            <CardContent className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-20 mt-1" />
            </CardHeader>
            <CardContent className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default async function CalendarPage() {
  // Optimized: Lightweight queries with only calendar-required fields
  const [tasks, documents] = await Promise.all([
    getTasksForCalendar(),
    getDocumentsForCalendar()
  ]);

  // Get events for the calendar
  const events = [
    ...tasks.map(task => ({
      id: task.id,
      date: new Date(task.dueDate),
      title: task.title,
      type: "task" as const,
      status: task.status
    })),
    ...documents.map(doc => ({
      id: doc.id,
      date: new Date(doc.expiryDate!),
      title: doc.title,
      type: "document" as const,
      status: doc.status
    }))
  ];

  const upcomingTasks = tasks
    .filter(t => t.status === "PENDING" || t.status === "OVERDUE")
    .slice(0, 5);

  const now = new Date();
  const expiringDocuments = documents
    .filter(d => new Date(d.expiryDate!) > now)
    .slice(0, 5);

  return (
    <CalendarView
      events={events}
      upcomingTasks={upcomingTasks}
      expiringDocuments={expiringDocuments}
    />
  );
}
