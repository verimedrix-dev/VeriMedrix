"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  Phone,
  Mail,
  Shield,
  ArrowRight,
} from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";
import Link from "next/link";
import { TimesheetStatus, PaymentStatus, LocumSourceType } from "@prisma/client";

interface LocumDashboardProps {
  data: {
    locum: {
      id: string;
      fullName: string;
      email: string | null;
      phone: string | null;
      hourlyRate: number;
      sourceType: LocumSourceType;
      agencyName: string | null;
      hpcsaNumber: string | null;
      hpcsaExpiry: Date | null;
      indemnityInsuranceNumber: string | null;
      indemnityInsuranceExpiry: Date | null;
    };
    stats: {
      pendingApproval: number;
      approved: number;
      rejected: number;
      totalHours: number;
      totalEarnings: number;
      monthlyHours: number;
      monthlyEarnings: number;
      totalTimesheets: number;
    };
    recentTimesheets: {
      id: string;
      date: Date;
      clockIn: Date | null;
      clockOut: Date | null;
      hoursWorked: number | null;
      totalPayable: number | null;
      status: TimesheetStatus;
      paymentStatus: PaymentStatus;
      breakMinutes: number;
      notes: string | null;
    }[];
  };
}

function getStatusBadge(status: TimesheetStatus) {
  switch (status) {
    case "CLOCKED_IN":
      return <Badge className="bg-blue-100 text-blue-700">Working</Badge>;
    case "CLOCKED_OUT":
      return <Badge className="bg-amber-100 text-amber-700">Pending Approval</Badge>;
    case "APPROVED":
      return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
    case "REJECTED":
      return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getExpiryStatus(date: Date | null) {
  if (!date) return null;
  const daysUntil = differenceInDays(date, new Date());
  if (isPast(date)) {
    return { status: "expired", label: "Expired", color: "text-red-600" };
  }
  if (daysUntil <= 30) {
    return { status: "expiring", label: `Expires in ${daysUntil} days`, color: "text-amber-600" };
  }
  return { status: "valid", label: `Valid until ${format(date, "dd MMM yyyy")}`, color: "text-green-600" };
}

export function LocumDashboard({ data }: LocumDashboardProps) {
  const { locum, stats, recentTimesheets } = data;
  const hpcsaStatus = getExpiryStatus(locum.hpcsaExpiry);
  const indemnityStatus = getExpiryStatus(locum.indemnityInsuranceExpiry);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Welcome, {locum.fullName.split(" ")[0]}!
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Here&apos;s your timesheet and earnings overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              This Month
            </CardDescription>
            <CardTitle className="text-4xl font-bold">
              {stats.monthlyHours.toFixed(1)}h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Hours worked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              This Month
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-green-600">
              R{stats.monthlyEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Earnings (approved)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Pending
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-amber-600">
              {stats.pendingApproval}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-purple-600" />
              Total Hours
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-purple-600">
              {stats.totalHours.toFixed(0)}h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">All time</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Timesheets */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Timesheets
                </CardTitle>
                <CardDescription>
                  Your latest recorded shifts
                </CardDescription>
              </div>
              <Link href="/my-timesheets">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentTimesheets.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  No timesheets yet
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Your timesheets will appear here once you clock in.
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTimesheets.map((ts) => (
                      <TableRow key={ts.id}>
                        <TableCell className="font-medium">
                          {format(new Date(ts.date), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {ts.clockIn ? format(new Date(ts.clockIn), "HH:mm") : "--"} -{" "}
                            {ts.clockOut ? format(new Date(ts.clockOut), "HH:mm") : "--"}
                            {ts.breakMinutes > 0 && (
                              <span className="text-xs text-slate-500 ml-1">
                                ({ts.breakMinutes}m break)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {ts.hoursWorked?.toFixed(2) || 0}h
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            R{ts.totalPayable?.toFixed(2) || 0}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(ts.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              My Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Rate</p>
              <p className="font-semibold text-lg">R{locum.hourlyRate.toFixed(2)}/hr</p>
            </div>

            {locum.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="text-sm">{locum.email}</span>
              </div>
            )}

            {locum.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                <span className="text-sm">{locum.phone}</span>
              </div>
            )}

            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Credentials</p>

              {/* HPCSA */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">HPCSA</span>
                </div>
                {hpcsaStatus ? (
                  <span className={`text-xs ${hpcsaStatus.color}`}>
                    {hpcsaStatus.label}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Not set</span>
                )}
              </div>

              {/* Indemnity */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Indemnity</span>
                </div>
                {indemnityStatus ? (
                  <span className={`text-xs ${indemnityStatus.color}`}>
                    {indemnityStatus.label}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Not set</span>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-slate-500">Total Earnings (All Time)</p>
              <p className="font-bold text-2xl text-green-600">
                R{stats.totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
