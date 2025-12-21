"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  TrendingUp,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import Link from "next/link";

interface Training {
  id: string;
  trainingName: string;
  provider: string | null;
  completedDate: Date;
  expiryDate: Date | null;
  status: string;
  score: number | null;
  cpdPoints: number | null;
  certificateUrl: string | null;
  certificateNumber: string | null;
  year: number;
  TrainingModule: {
    id: string;
    name: string;
  } | null;
}

interface TrainingCompliance {
  module: {
    id: string;
    name: string;
  };
  isRequired: boolean;
  isCompleted: boolean;
}

interface EmployeeTrainingTabProps {
  employeeId: string;
  employeeName: string;
  trainings: Training[];
  compliance: {
    compliance: TrainingCompliance[];
    requiredCompleted: number;
    requiredTotal: number;
    compliancePercentage: number;
  } | null;
  cpdSummary: {
    year: number;
    totalCpdPoints: number;
    completedCount: number;
    failedCount: number;
    inProgressCount: number;
    totalCount: number;
  } | null;
}

export function EmployeeTrainingTab({
  employeeId,
  employeeName,
  trainings,
  compliance,
  cpdSummary,
}: EmployeeTrainingTabProps) {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Group trainings by year
  const trainingsByYear = trainings.reduce((acc, training) => {
    const year = training.year;
    if (!acc[year]) acc[year] = [];
    acc[year].push(training);
    return acc;
  }, {} as Record<number, Training[]>);

  const years = Object.keys(trainingsByYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      {/* CPD Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Compliance Status */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Compliance</p>
                <p className="text-2xl font-bold">
                  {compliance?.compliancePercentage ?? 100}%
                </p>
              </div>
              {compliance && compliance.compliancePercentage === 100 ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : compliance && compliance.compliancePercentage > 0 ? (
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              ) : (
                <XCircle className="h-8 w-8 text-red-500" />
              )}
            </div>
            {compliance && compliance.requiredTotal > 0 && (
              <div className="mt-2">
                <Progress
                  value={compliance.compliancePercentage}
                  className={`h-2 ${
                    compliance.compliancePercentage === 100
                      ? "[&>div]:bg-green-500"
                      : compliance.compliancePercentage > 0
                      ? "[&>div]:bg-amber-500"
                      : "[&>div]:bg-red-500"
                  }`}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {compliance.requiredCompleted}/{compliance.requiredTotal} required trainings
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CPD Points This Year */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">CPD Points {currentYear}</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {cpdSummary?.totalCpdPoints ?? 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        {/* Completed This Year */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Completed {currentYear}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {cpdSummary?.completedCount ?? 0}
                </p>
              </div>
              <Award className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Total Trainings */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Trainings</p>
                <p className="text-2xl font-bold">
                  {trainings.length}
                </p>
              </div>
              <GraduationCap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Required Trainings Status */}
      {compliance && compliance.compliance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Required Training Status</CardTitle>
            <CardDescription>
              Trainings required for {employeeName}&apos;s position
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {compliance.compliance.map((item) => (
                <div
                  key={item.module.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    item.isCompleted
                      ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                      : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">{item.module.name}</span>
                  </div>
                  {item.isRequired && (
                    <Badge variant="outline" className="text-xs">Required</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Training History by Year */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Training History</CardTitle>
              <CardDescription>
                All training completions and certifications
              </CardDescription>
            </div>
            <Link href={`/training`}>
              <Button variant="outline" size="sm">
                <GraduationCap className="h-4 w-4 mr-2" />
                Go to Training
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {trainings.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No training records yet</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                Record trainings from the Training page
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {years.map((year) => (
                <div key={year}>
                  <h4 className="font-medium text-lg mb-3 flex items-center gap-2">
                    {year}
                    <Badge variant="outline" className="text-xs">
                      {trainingsByYear[year].length} training{trainingsByYear[year].length !== 1 ? "s" : ""}
                    </Badge>
                    {trainingsByYear[year].some(t => t.cpdPoints) && (
                      <Badge className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                        {trainingsByYear[year].reduce((sum, t) => sum + (t.cpdPoints || 0), 0)} CPD
                      </Badge>
                    )}
                  </h4>
                  <div className="space-y-3">
                    {trainingsByYear[year].map((training) => {
                      const isExpired = training.expiryDate && new Date(training.expiryDate) < now;
                      const isExpiringSoon = training.expiryDate &&
                        !isExpired &&
                        differenceInDays(new Date(training.expiryDate), now) <= 30;

                      return (
                        <div
                          key={training.id}
                          className={`p-4 rounded-lg border ${
                            isExpired
                              ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                              : isExpiringSoon
                              ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
                              : "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-medium">{training.trainingName}</h5>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {training.provider && (
                                  <span className="text-sm text-slate-500">
                                    {training.provider}
                                  </span>
                                )}
                                <span className="text-sm text-slate-400">
                                  Completed: {format(new Date(training.completedDate), "MMM d, yyyy")}
                                </span>
                                {training.expiryDate && (
                                  <span className={`text-sm ${
                                    isExpired
                                      ? "text-red-600"
                                      : isExpiringSoon
                                      ? "text-amber-600"
                                      : "text-slate-400"
                                  }`}>
                                    {isExpired ? "Expired: " : "Expires: "}
                                    {format(new Date(training.expiryDate), "MMM d, yyyy")}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {training.status === "COMPLETED" && (
                                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Passed
                                  </Badge>
                                )}
                                {training.status === "FAILED" && (
                                  <Badge variant="destructive">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Failed
                                  </Badge>
                                )}
                                {training.status === "IN_PROGRESS" && (
                                  <Badge variant="secondary">
                                    <Clock className="h-3 w-3 mr-1" />
                                    In Progress
                                  </Badge>
                                )}
                                {training.score !== null && (
                                  <Badge variant="outline">
                                    Score: {training.score}%
                                  </Badge>
                                )}
                                {training.cpdPoints && (
                                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                    {training.cpdPoints} CPD
                                  </Badge>
                                )}
                                {training.certificateNumber && (
                                  <Badge variant="outline">
                                    Cert: {training.certificateNumber}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {training.certificateUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(training.certificateUrl!, "_blank")}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
