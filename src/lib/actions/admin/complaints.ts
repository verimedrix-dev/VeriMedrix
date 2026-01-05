"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "./users";

export async function getComplaintsOverview() {
  await requireSuperAdmin();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;

  // Get all complaints
  const allComplaints = await prisma.complaint.findMany({
    select: {
      id: true,
      status: true,
      category: true,
      dateReceived: true,
      acknowledgedAt: true,
      resolvedAt: true,
      createdAt: true,
    },
  });

  // Calculate metrics
  const totalComplaints = allComplaints.length;
  const last30Days = allComplaints.filter(c => new Date(c.createdAt) >= thirtyDaysAgo);
  const last7Days = allComplaints.filter(c => new Date(c.createdAt) >= sevenDaysAgo);

  // Status breakdown
  const statusCounts = allComplaints.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Category breakdown
  const categoryCounts = allComplaints.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Acknowledgement compliance (within 5 days)
  const complaintsWithAck = allComplaints.filter(c => c.acknowledgedAt);
  const acknowledgedOnTime = complaintsWithAck.filter(c => {
    const received = new Date(c.dateReceived).getTime();
    const acknowledged = new Date(c.acknowledgedAt!).getTime();
    return (acknowledged - received) <= fiveDaysMs;
  });
  const ackComplianceRate = complaintsWithAck.length > 0
    ? Math.round((acknowledgedOnTime.length / complaintsWithAck.length) * 100)
    : 100;

  // Overdue acknowledgements (not acknowledged within 5 days)
  const overdueAck = allComplaints.filter(c => {
    if (c.acknowledgedAt) return false;
    if (["RESOLVED", "CLOSED"].includes(c.status)) return false;
    const received = new Date(c.dateReceived).getTime();
    return (now.getTime() - received) > fiveDaysMs;
  });

  // Resolution metrics
  const resolvedComplaints = allComplaints.filter(c => c.resolvedAt);
  const avgResolutionDays = resolvedComplaints.length > 0
    ? Math.round(
        resolvedComplaints.reduce((sum, c) => {
          const received = new Date(c.dateReceived).getTime();
          const resolved = new Date(c.resolvedAt!).getTime();
          return sum + (resolved - received) / (24 * 60 * 60 * 1000);
        }, 0) / resolvedComplaints.length
      )
    : 0;

  // Open complaints
  const openComplaints = allComplaints.filter(c => !["RESOLVED", "CLOSED"].includes(c.status));

  // Monthly trend (last 6 months)
  const monthlyTrend: { month: string; count: number; resolved: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const monthName = monthStart.toLocaleString("default", { month: "short" });

    const monthComplaints = allComplaints.filter(c => {
      const date = new Date(c.createdAt);
      return date >= monthStart && date <= monthEnd;
    });

    const monthResolved = monthComplaints.filter(c => ["RESOLVED", "CLOSED"].includes(c.status));

    monthlyTrend.push({
      month: monthName,
      count: monthComplaints.length,
      resolved: monthResolved.length,
    });
  }

  // Practices with most complaints (anonymized counts)
  const practiceComplaintCounts = await prisma.complaint.groupBy({
    by: ["practiceId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  // Distribution of complaints per practice
  const complaintsPerPractice = practiceComplaintCounts.map(p => p._count.id);
  const avgComplaintsPerPractice = complaintsPerPractice.length > 0
    ? Math.round((complaintsPerPractice.reduce((a, b) => a + b, 0) / complaintsPerPractice.length) * 10) / 10
    : 0;

  return {
    summary: {
      total: totalComplaints,
      last30Days: last30Days.length,
      last7Days: last7Days.length,
      open: openComplaints.length,
      overdueAcknowledgement: overdueAck.length,
    },
    compliance: {
      acknowledgementRate: ackComplianceRate,
      avgResolutionDays,
      avgComplaintsPerPractice,
    },
    byStatus: Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    })).sort((a, b) => b.count - a.count),
    byCategory: Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
    })).sort((a, b) => b.count - a.count),
    monthlyTrend,
  };
}
