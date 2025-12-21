"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  isSameMonth,
} from "date-fns";
import { CalendarDays, FileText, CheckSquare, ChevronLeft, ChevronRight } from "lucide-react";

type CalendarEvent = {
  id: string;
  date: Date;
  title: string;
  type: "task" | "document";
  status: string;
};

type Task = {
  id: string;
  title: string;
  dueDate: Date;
  status: string;
};

type Document = {
  id: string;
  title: string;
  expiryDate: Date | null;
};

interface CalendarViewProps {
  events: CalendarEvent[];
  upcomingTasks: Task[];
  expiringDocuments: Document[];
}

export function CalendarView({ events, upcomingTasks, expiringDocuments }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(new Date(event.date), day));
  };

  const isCurrentMonth = isSameMonth(currentDate, new Date());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Calendar</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          View upcoming tasks and document expiry dates
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Calendar Grid */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                {format(currentDate, "MMMM yyyy")}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  disabled={isCurrentMonth}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month start */}
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="min-h-24 bg-slate-50 dark:bg-slate-800 rounded-lg"
                />
              ))}

              {daysInMonth.map((day) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-24 p-2 rounded-lg border ${
                      isCurrentDay
                        ? "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800"
                        : "bg-white border-slate-100 hover:border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:hover:border-slate-600"
                    }`}
                  >
                    <div
                      className={`text-sm font-medium mb-1 ${
                        isCurrentDay
                          ? "text-blue-600 dark:text-white"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs truncate px-1 py-0.5 rounded ${
                            event.type === "task"
                              ? event.status === "COMPLETED"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-white"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                          }`}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Upcoming Tasks</CardTitle>
              <CardDescription>Next 7 days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 text-sm">
                    <CheckSquare className="h-4 w-4 text-blue-500 dark:text-white" />
                    <span className="truncate flex-1 dark:text-slate-300">
                      {task.title}
                    </span>
                    <Badge
                      variant={task.status === "OVERDUE" ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {format(new Date(task.dueDate), "MMM d")}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No upcoming tasks
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Expiring Documents</CardTitle>
              <CardDescription>Next 30 days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {expiringDocuments.length > 0 ? (
                expiringDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                    <span className="truncate flex-1 dark:text-slate-300">
                      {doc.title}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {doc.expiryDate && format(new Date(doc.expiryDate), "MMM d")}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No expiring documents
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
