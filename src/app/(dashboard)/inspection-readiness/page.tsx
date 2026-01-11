import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Shield,
  FileText,
  Users,
  Activity,
  Flame,
  MessageSquare,
  GraduationCap,
  TrendingUp,
  Pill,
  Award,
  Trash2,
  UserCheck,
} from "lucide-react";
import { getInspectionReadinessData, NonNegotiableStatus } from "@/lib/actions/inspection-readiness";
import Link from "next/link";

export const dynamic = "force-dynamic";

const iconMap: Record<string, React.ElementType> = {
  Award,
  UserCheck,
  Shield,
  Trash2,
  MessageSquare,
  Flame,
  Activity,
  Pill,
  FileText,
  AlertTriangle,
  GraduationCap,
  TrendingUp,
  Users,
};

function getStatusIcon(status: NonNegotiableStatus["status"]) {
  switch (status) {
    case "compliant":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "attention":
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    case "non_compliant":
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <HelpCircle className="h-5 w-5 text-slate-400" />;
  }
}

function getStatusBadge(status: NonNegotiableStatus["status"]) {
  switch (status) {
    case "compliant":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          Compliant
        </Badge>
      );
    case "attention":
      return (
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
          Needs Attention
        </Badge>
      );
    case "non_compliant":
      return (
        <Badge variant="destructive">
          Non-Compliant
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          Not Assessed
        </Badge>
      );
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getProgressColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function NonNegotiableCard({ item }: { item: NonNegotiableStatus }) {
  const Icon = iconMap[item.icon] || Shield;

  return (
    <Card className={`transition-all hover:shadow-md ${
      item.status === "non_compliant" ? "border-red-200 dark:border-red-800" :
      item.status === "attention" ? "border-amber-200 dark:border-amber-800" :
      item.status === "compliant" ? "border-green-200 dark:border-green-800" : ""
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`p-3 rounded-lg ${
            item.status === "compliant" ? "bg-green-100 dark:bg-green-900/50" :
            item.status === "attention" ? "bg-amber-100 dark:bg-amber-900/50" :
            item.status === "non_compliant" ? "bg-red-100 dark:bg-red-900/50" :
            "bg-slate-100 dark:bg-slate-800"
          }`}>
            <Icon className={`h-6 w-6 ${
              item.status === "compliant" ? "text-green-600 dark:text-green-400" :
              item.status === "attention" ? "text-amber-600 dark:text-amber-400" :
              item.status === "non_compliant" ? "text-red-600 dark:text-red-400" :
              "text-slate-600 dark:text-slate-400"
            }`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  #{item.id}
                </span>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
              </div>
              {getStatusIcon(item.status)}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {item.description}
            </p>

            {/* Document status */}
            {item.details.documents.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {item.details.documents.map((doc) => (
                  <Badge
                    key={doc.name}
                    variant="outline"
                    className={`text-xs ${
                      doc.status === "current" ? "border-green-300 text-green-700 dark:border-green-700 dark:text-green-300" :
                      doc.status === "expiring" ? "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300" :
                      doc.status === "expired" ? "border-red-300 text-red-700 dark:border-red-700 dark:text-red-300" :
                      "border-slate-300 text-slate-500"
                    }`}
                  >
                    {doc.status === "current" && <CheckCircle className="h-3 w-3 mr-1" />}
                    {doc.status === "expiring" && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {doc.status === "expired" && <XCircle className="h-3 w-3 mr-1" />}
                    {doc.status === "missing" && <HelpCircle className="h-3 w-3 mr-1" />}
                    {doc.name.length > 30 ? doc.name.substring(0, 30) + "..." : doc.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Notes */}
            {item.details.notes && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">
                {item.details.notes}
              </p>
            )}

            {/* Score bar */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex-1">
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${getProgressColor(item.score)}`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
              <span className={`text-sm font-bold ${getScoreColor(item.score)}`}>
                {item.score}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function InspectionReadinessPage() {
  const data = await getInspectionReadinessData();

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-500">Unable to load inspection readiness data</p>
      </div>
    );
  }

  const { nonNegotiables, summary } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Inspection Readiness
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            OHSC 12 Non-Negotiables Compliance Dashboard
          </p>
        </div>
        <Link
          href="/documents"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FileText className="h-4 w-4" />
          Manage Documents
        </Link>
      </div>

      {/* Overall Score Card */}
      <Card className={`${
        summary.overallScore >= 80 ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800" :
        summary.overallScore >= 50 ? "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-800" :
        "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800"
      }`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 uppercase tracking-wide font-medium">
                Overall Readiness Score
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-5xl font-bold ${getScoreColor(summary.overallScore)}`}>
                  {summary.overallScore}%
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {summary.overallScore >= 80 ? "Inspection Ready" :
                   summary.overallScore >= 50 ? "Needs Improvement" :
                   "Requires Urgent Attention"}
                </span>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {summary.compliantCount}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Compliant</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {summary.attentionCount}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Attention</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {summary.nonCompliantCount}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Non-Compliant</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={summary.overallScore} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/documents">
          <Card className="hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Documents</p>
                  <p className="text-xs text-slate-500">Upload missing docs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/complaints">
          <Card className="hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                  <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Complaints</p>
                  <p className="text-xs text-slate-500">Manage register</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/adverse-events">
          <Card className="hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Adverse Events</p>
                  <p className="text-xs text-slate-500">Track incidents</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/logbook">
          <Card className="hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                  <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Logbook</p>
                  <p className="text-xs text-slate-500">Daily tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Non-Negotiables Grid */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          12 Non-Negotiables
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {nonNegotiables.map((item) => (
            <NonNegotiableCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Legend */}
      <Card className="bg-slate-50 dark:bg-slate-900/50">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-slate-600 dark:text-slate-400">Compliant (80-100%)</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-slate-600 dark:text-slate-400">Needs Attention (50-79%)</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-slate-600 dark:text-slate-400">Non-Compliant (&lt;50%)</span>
            </div>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">Not Yet Assessed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
