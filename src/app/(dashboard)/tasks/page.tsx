import nextDynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckSquare,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { getTasksPageData } from "@/lib/actions/tasks";
import { TaskCard } from "@/components/tasks/task-card";

export const dynamic = "force-dynamic";

// Dynamic import for dialog - not needed on initial render
const CreateTaskDialog = nextDynamic(
  () => import("@/components/tasks/create-dialog").then((mod) => mod.CreateTaskDialog),
  {
    loading: () => <Skeleton className="h-10 w-32" />,
  }
);

export default async function TasksPage() {
  // Optimized: Single auth call + parallel DB queries
  const data = await getTasksPageData();
  const tasks = data?.tasks || [];
  const stats = data?.stats;

  const completedTasks = tasks.filter((t) => t.status === "COMPLETED" || t.status === "VERIFIED");
  const pendingTasks = tasks.filter((t) => t.status === "PENDING");
  const overdueTasks = tasks.filter((t) => t.status === "OVERDUE");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Task Manager</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Track and complete your daily compliance tasks
          </p>
        </div>
        <CreateTaskDialog />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats?.overdue || 0}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                <Clock className="h-5 w-5 text-blue-600 dark:text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700 dark:text-white">{stats?.pending || 0}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Pending</p>
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
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats?.completed || 0}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                <CheckSquare className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-700 dark:text-white">{stats?.total || 0}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Total Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search tasks..." className="pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="monitoring">Monitoring</SelectItem>
              <SelectItem value="hygiene">Hygiene</SelectItem>
              <SelectItem value="safety">Safety</SelectItem>
              <SelectItem value="waste">Waste Management</SelectItem>
              <SelectItem value="inventory">Inventory</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              <SelectItem value="me">Assigned to Me</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tasks Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All Tasks
            <Badge variant="secondary" className="ml-2">
              {tasks.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Overdue
            <Badge variant="destructive" className="ml-2">
              {overdueTasks.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-white">
              {pendingTasks.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              {completedTasks.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckSquare className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <p className="text-slate-600 dark:text-slate-400 mb-2">No tasks yet</p>
                <p className="text-sm text-slate-500 dark:text-slate-500">Click &quot;Create Task&quot; to add your first task</p>
              </CardContent>
            </Card>
          ) : (
            tasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-3">
          {overdueTasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
                <p>No overdue tasks. Great job!</p>
              </CardContent>
            </Card>
          ) : (
            overdueTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-3">
          {pendingTasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500 dark:text-slate-400">
                <Clock className="h-12 w-12 mx-auto text-blue-500 dark:text-white mb-3" />
                <p>No pending tasks</p>
              </CardContent>
            </Card>
          ) : (
            pendingTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3">
          {completedTasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                <CheckCircle className="h-12 w-12 mx-auto text-slate-400 mb-3" />
                <p>No completed tasks yet</p>
              </CardContent>
            </Card>
          ) : (
            completedTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
