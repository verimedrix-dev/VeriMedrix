"use client";

import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface EmployeeCompliance {
  id: string;
  fullName: string;
  position: string;
  completedRequired: number;
  totalRequired: number;
  compliancePercentage: number;
  totalTrainings: number;
}

interface EmployeeComplianceTableProps {
  employees: EmployeeCompliance[];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function EmployeeComplianceTable({ employees }: EmployeeComplianceTableProps) {
  if (employees.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500 dark:text-slate-400">No employees found.</p>
      </div>
    );
  }

  return (
    <div className="divide-y dark:divide-slate-700">
      {employees.map((employee) => {
        const isFullyCompliant = employee.compliancePercentage === 100;
        const hasNoRequirements = employee.totalRequired === 0;
        const isPartiallyCompliant = employee.compliancePercentage > 0 && employee.compliancePercentage < 100;

        return (
          <Link
            key={employee.id}
            href={`/employees/${employee.id}?tab=training`}
            className="flex items-center justify-between py-4 hover:bg-slate-50 dark:hover:bg-slate-800 -mx-4 px-4 transition-colors"
          >
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-medium text-sm">
                  {getInitials(employee.fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white">
                  {employee.fullName}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {employee.position}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Training count */}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {employee.totalTrainings}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  total trainings
                </p>
              </div>

              {/* Compliance status */}
              <div className="w-40">
                {hasNoRequirements ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      No requirements set
                    </Badge>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">
                        {employee.completedRequired}/{employee.totalRequired} required
                      </span>
                      {isFullyCompliant ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : isPartiallyCompliant ? (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <Progress
                      value={employee.compliancePercentage}
                      className={`h-2 ${
                        isFullyCompliant
                          ? "[&>div]:bg-green-500"
                          : isPartiallyCompliant
                          ? "[&>div]:bg-amber-500"
                          : "[&>div]:bg-red-500"
                      }`}
                    />
                  </div>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
