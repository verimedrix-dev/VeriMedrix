/**
 * Reset All Data Script
 *
 * This script deletes ALL data from the database EXCEPT:
 * - SUPER_ADMIN users (admin panel access)
 * - System configuration tables (DocumentCategory, DocumentType, TaxTable, etc.)
 *
 * WARNING: This is destructive and cannot be undone!
 *
 * Usage: npx tsx scripts/reset-all-data.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetAllData() {
  console.log("=".repeat(60));
  console.log("WARNING: This will delete ALL data except SUPER_ADMIN users!");
  console.log("=".repeat(60));
  console.log("");

  try {
    // Start transaction for safety
    await prisma.$transaction(async (tx) => {
      console.log("Starting data reset...\n");

      // 1. Delete all UserPractice entries (except for super admins)
      const deletedUserPractices = await tx.userPractice.deleteMany({
        where: {
          User: {
            role: { not: "SUPER_ADMIN" }
          }
        }
      });
      console.log(`Deleted ${deletedUserPractices.count} UserPractice entries`);

      // 2. Delete all alerts
      const deletedAlerts = await tx.alert.deleteMany({});
      console.log(`Deleted ${deletedAlerts.count} alerts`);

      // 3. Delete all audit logs
      const deletedAuditLogs = await tx.auditLog.deleteMany({});
      console.log(`Deleted ${deletedAuditLogs.count} audit logs`);

      // 4. Delete all API usage logs
      const deletedApiLogs = await tx.apiUsageLog.deleteMany({});
      console.log(`Deleted ${deletedApiLogs.count} API usage logs`);

      // 5. Delete all email logs
      const deletedEmailLogs = await tx.emailLog.deleteMany({});
      console.log(`Deleted ${deletedEmailLogs.count} email logs`);

      // 6. Delete all error logs
      const deletedErrorLogs = await tx.errorLog.deleteMany({});
      console.log(`Deleted ${deletedErrorLogs.count} error logs`);

      // 7. Delete all payroll additions
      const deletedPayrollAdditions = await tx.payrollAddition.deleteMany({});
      console.log(`Deleted ${deletedPayrollAdditions.count} payroll additions`);

      // 8. Delete all payroll entries
      const deletedPayrollEntries = await tx.payrollEntry.deleteMany({});
      console.log(`Deleted ${deletedPayrollEntries.count} payroll entries`);

      // 9. Delete all payroll runs
      const deletedPayrollRuns = await tx.payrollRun.deleteMany({});
      console.log(`Deleted ${deletedPayrollRuns.count} payroll runs`);

      // 10. Delete all payroll audit logs
      const deletedPayrollAuditLogs = await tx.payrollAuditLog.deleteMany({});
      console.log(`Deleted ${deletedPayrollAuditLogs.count} payroll audit logs`);

      // 11. Delete all employee YTD records
      const deletedYTD = await tx.employeeYTD.deleteMany({});
      console.log(`Deleted ${deletedYTD.count} employee YTD records`);

      // 12. Delete all fringe benefits
      const deletedFringeBenefits = await tx.fringeBenefit.deleteMany({});
      console.log(`Deleted ${deletedFringeBenefits.count} fringe benefits`);

      // 13. Delete all garnishee orders
      const deletedGarnisheeOrders = await tx.garnisheeOrder.deleteMany({});
      console.log(`Deleted ${deletedGarnisheeOrders.count} garnishee orders`);

      // 14. Delete all training enrollments
      const deletedEnrollments = await tx.trainingEnrollment.deleteMany({});
      console.log(`Deleted ${deletedEnrollments.count} training enrollments`);

      // 15. Delete all training modules
      const deletedTrainingModules = await tx.trainingModule.deleteMany({});
      console.log(`Deleted ${deletedTrainingModules.count} training modules`);

      // 16. Delete all leave requests
      const deletedLeaveRequests = await tx.leaveRequest.deleteMany({});
      console.log(`Deleted ${deletedLeaveRequests.count} leave requests`);

      // 17. Delete all leave balances
      const deletedLeaveBalances = await tx.leaveBalance.deleteMany({});
      console.log(`Deleted ${deletedLeaveBalances.count} leave balances`);

      // 18. Delete all warnings
      const deletedWarnings = await tx.warning.deleteMany({});
      console.log(`Deleted ${deletedWarnings.count} warnings`);

      // 19. Delete all documents
      const deletedDocuments = await tx.document.deleteMany({});
      console.log(`Deleted ${deletedDocuments.count} documents`);

      // 20. Delete all practice documents
      const deletedPracticeDocuments = await tx.practiceDocument.deleteMany({});
      console.log(`Deleted ${deletedPracticeDocuments.count} practice documents`);

      // 21. Delete all tasks
      const deletedTasks = await tx.task.deleteMany({});
      console.log(`Deleted ${deletedTasks.count} tasks`);

      // 22. Delete all task templates
      const deletedTaskTemplates = await tx.taskTemplate.deleteMany({});
      console.log(`Deleted ${deletedTaskTemplates.count} task templates`);

      // 23. Delete all complaints
      const deletedComplaints = await tx.complaint.deleteMany({});
      console.log(`Deleted ${deletedComplaints.count} complaints`);

      // 24. Delete all adverse events
      const deletedAdverseEvents = await tx.adverseEvent.deleteMany({});
      console.log(`Deleted ${deletedAdverseEvents.count} adverse events`);

      // 25. Delete all team invitations
      const deletedInvitations = await tx.teamInvitation.deleteMany({});
      console.log(`Deleted ${deletedInvitations.count} team invitations`);

      // 26. Delete all locum shifts
      const deletedLocumShifts = await tx.locumShift.deleteMany({});
      console.log(`Deleted ${deletedLocumShifts.count} locum shifts`);

      // 27. Delete all locums
      const deletedLocums = await tx.locum.deleteMany({});
      console.log(`Deleted ${deletedLocums.count} locums`);

      // 28. Delete all employees
      const deletedEmployees = await tx.employee.deleteMany({});
      console.log(`Deleted ${deletedEmployees.count} employees`);

      // 29. Delete all non-super-admin users
      const deletedUsers = await tx.user.deleteMany({
        where: {
          role: { not: "SUPER_ADMIN" }
        }
      });
      console.log(`Deleted ${deletedUsers.count} users (kept SUPER_ADMIN users)`);

      // 30. Delete all practices
      const deletedPractices = await tx.practice.deleteMany({});
      console.log(`Deleted ${deletedPractices.count} practices`);

      console.log("\n" + "=".repeat(60));
      console.log("Data reset complete!");
      console.log("=".repeat(60));

      // Show remaining super admin users
      const superAdmins = await tx.user.findMany({
        where: { role: "SUPER_ADMIN" },
        select: { email: true, name: true }
      });

      if (superAdmins.length > 0) {
        console.log("\nRemaining SUPER_ADMIN users:");
        superAdmins.forEach(admin => {
          console.log(`  - ${admin.email} (${admin.name || "No name"})`);
        });
      }
    }, {
      timeout: 60000 // 60 second timeout for large datasets
    });

  } catch (error) {
    console.error("Error resetting data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reset
resetAllData()
  .then(() => {
    console.log("\nDone!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to reset data:", error);
    process.exit(1);
  });
