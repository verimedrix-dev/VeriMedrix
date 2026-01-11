import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || "admin@verimedrix.com";
const APP_NAME = "VeriMedrix";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Failed to send email:", error);
      throw error;
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
}

// Document Expiry Email Templates
export function getDocumentExpiryEmail({
  practiceName,
  documentName,
  expiryDate,
  daysUntilExpiry,
  documentUrl,
}: {
  practiceName: string;
  documentName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  documentUrl: string;
}) {
  const urgencyColor = daysUntilExpiry <= 7 ? "#DC2626" : daysUntilExpiry <= 30 ? "#D97706" : "#059669";
  const urgencyText = daysUntilExpiry <= 7 ? "URGENT" : daysUntilExpiry <= 30 ? "Action Required" : "Reminder";

  return {
    subject: `${urgencyText}: ${documentName} expires in ${daysUntilExpiry} days`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">VeriMedrix</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Document Expiry Alert</p>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <div style="background: ${urgencyColor}15; border-left: 4px solid ${urgencyColor}; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: ${urgencyColor}; font-weight: bold; font-size: 14px;">${urgencyText}</p>
      <p style="margin: 5px 0 0 0; color: #374151;">Your document expires in <strong>${daysUntilExpiry} days</strong></p>
    </div>

    <p>Hello,</p>
    <p>This is a reminder that the following document for <strong>${practiceName}</strong> is approaching its expiry date:</p>

    <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748B;">Document:</td>
          <td style="padding: 8px 0; font-weight: bold;">${documentName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748B;">Expiry Date:</td>
          <td style="padding: 8px 0; font-weight: bold; color: ${urgencyColor};">${expiryDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748B;">Days Remaining:</td>
          <td style="padding: 8px 0; font-weight: bold;">${daysUntilExpiry} days</td>
        </tr>
      </table>
    </div>

    <p><strong>Action Required:</strong> Please ensure this document is renewed before the expiry date to maintain compliance.</p>

    <a href="${documentUrl}" style="display: inline-block; background: #1E40AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0;">View Document</a>

    <p style="margin-top: 30px; font-size: 14px; color: #64748B;">
      This is an automated notification from VeriMedrix.
    </p>
  </div>

  <div style="background: #F8FAFC; padding: 20px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
    <p style="margin: 0; font-size: 12px; color: #64748B;">
      © ${new Date().getFullYear()} VeriMedrix
    </p>
  </div>
</body>
</html>
    `,
  };
}

// Task Assignment Email Template
export function getTaskAssignmentEmail({
  recipientName,
  taskTitle,
  taskDescription,
  dueDate,
  dueTime,
  taskUrl,
}: {
  recipientName: string;
  taskTitle: string;
  taskDescription: string;
  dueDate: string;
  dueTime?: string;
  taskUrl: string;
}) {
  return {
    subject: `New Task Assigned: ${taskTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">VeriMedrix</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Task Assignment</p>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p>Hello ${recipientName},</p>
    <p>A new compliance task has been assigned to you:</p>

    <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #1E40AF;">${taskTitle}</h3>
      <p style="margin: 0 0 15px 0; color: #64748B;">${taskDescription}</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748B;">Due Date:</td>
          <td style="padding: 8px 0; font-weight: bold;">${dueDate}${dueTime ? ` at ${dueTime}` : ""}</td>
        </tr>
      </table>
    </div>

    <a href="${taskUrl}" style="display: inline-block; background: #1E40AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0;">View Task</a>

    <p style="margin-top: 30px; font-size: 14px; color: #64748B;">
      This is an automated notification from VeriMedrix.
    </p>
  </div>

  <div style="background: #F8FAFC; padding: 20px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
    <p style="margin: 0; font-size: 12px; color: #64748B;">
      © ${new Date().getFullYear()} VeriMedrix
    </p>
  </div>
</body>
</html>
    `,
  };
}

// Team Invitation Email Template
export function getTeamInvitationEmail({
  employeeName,
  practiceName,
  inviterName,
  accessLevel,
  inviteUrl,
  expiryDate,
}: {
  employeeName: string;
  practiceName: string;
  inviterName: string;
  accessLevel: string;
  inviteUrl: string;
  expiryDate: string;
}) {
  return {
    subject: `You've been invited to join ${practiceName} on VeriMedrix`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">VeriMedrix</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Team Invitation</p>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p>Hello ${employeeName},</p>
    <p>${inviterName} has invited you to join <strong>${practiceName}</strong> on VeriMedrix, our healthcare compliance management platform.</p>

    <div style="background: #F0F9FF; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #BAE6FD;">
      <h3 style="margin: 0 0 10px 0; color: #1E40AF;">Your Access Level</h3>
      <p style="margin: 0; font-size: 18px; font-weight: bold; color: #1E40AF;">${accessLevel}</p>
    </div>

    <p>Click the button below to accept the invitation and create your account:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteUrl}" style="display: inline-block; background: #1E40AF; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Accept Invitation</a>
    </div>

    <p style="font-size: 14px; color: #64748B;">This invitation will expire on <strong>${expiryDate}</strong>.</p>

    <p style="font-size: 14px; color: #64748B; margin-top: 20px;">
      If you didn't expect this invitation, you can safely ignore this email.
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

    <p style="font-size: 12px; color: #94A3B8;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${inviteUrl}" style="color: #1E40AF; word-break: break-all;">${inviteUrl}</a>
    </p>
  </div>

  <div style="background: #F8FAFC; padding: 20px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
    <p style="margin: 0; font-size: 12px; color: #64748B;">
      &copy; ${new Date().getFullYear()} VeriMedrix - Healthcare Compliance Made Easy
    </p>
  </div>
</body>
</html>
    `,
  };
}

// Task Overdue Email Template
export function getTaskOverdueEmail({
  recipientName,
  taskTitle,
  dueDate,
  taskUrl,
}: {
  recipientName: string;
  taskTitle: string;
  dueDate: string;
  taskUrl: string;
}) {
  return {
    subject: `OVERDUE: ${taskTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">VeriMedrix</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Overdue Task Alert</p>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <div style="background: #FEE2E2; border-left: 4px solid #DC2626; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #DC2626; font-weight: bold;">ACTION REQUIRED</p>
      <p style="margin: 5px 0 0 0; color: #374151;">This task is overdue and needs immediate attention</p>
    </div>

    <p>Hello ${recipientName},</p>
    <p>The following compliance task is overdue:</p>

    <div style="background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #FECACA;">
      <h3 style="margin: 0 0 10px 0; color: #DC2626;">${taskTitle}</h3>
      <p style="margin: 0; color: #64748B;">Was due: <strong>${dueDate}</strong></p>
    </div>

    <p>Please complete this task as soon as possible to maintain compliance.</p>

    <a href="${taskUrl}" style="display: inline-block; background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0;">Complete Task Now</a>

    <p style="margin-top: 30px; font-size: 14px; color: #64748B;">
      This is an automated notification from VeriMedrix.
    </p>
  </div>

  <div style="background: #F8FAFC; padding: 20px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
    <p style="margin: 0; font-size: 12px; color: #64748B;">
      © ${new Date().getFullYear()} VeriMedrix
    </p>
  </div>
</body>
</html>
    `,
  };
}

// Welcome Email Template
export function getWelcomeEmail({
  userName,
  practiceName,
  dashboardUrl,
}: {
  userName: string;
  practiceName?: string;
  dashboardUrl: string;
}) {
  return {
    subject: `Welcome to VeriMedrix - Let's Get You Compliant!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to VeriMedrix! 🎉</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">OHSC Compliance Made Simple</p>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px;">Hi there,</p>

    <p style="font-size: 16px;">Thank you for signing up for VeriMedrix! We're excited to help you streamline your OHSC compliance management${practiceName ? ` for <strong>${practiceName}</strong>` : ""}.</p>

    <div style="background: #F0F9FF; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #2563eb;">
      <h3 style="margin: 0 0 12px 0; color: #1e40af;">With VeriMedrix, you can:</h3>
      <ul style="margin: 0; padding-left: 20px; color: #475569;">
        <li style="margin-bottom: 8px;">Track all 41+ mandatory OHSC documents</li>
        <li style="margin-bottom: 8px;">Get automatic expiry reminders</li>
        <li style="margin-bottom: 8px;">Manage compliance tasks</li>
        <li style="margin-bottom: 8px;">Stay inspection-ready at all times</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Go to Dashboard</a>
    </div>

    <p style="font-size: 14px; color: #64748B; margin-top: 24px;">
      If you have any questions, feel free to reach out to our support team. We're here to help you stay compliant!
    </p>
  </div>

  <div style="background: #F8FAFC; padding: 20px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
    <p style="margin: 0; font-size: 12px; color: #64748B;">
      © ${new Date().getFullYear()} VeriMedrix. All rights reserved.
    </p>
    <p style="margin: 8px 0 0 0; font-size: 12px; color: #94a3b8;">
      Built for South African healthcare practices.
    </p>
  </div>
</body>
</html>
    `,
  };
}

// Convenience function to send welcome email
export async function sendWelcomeEmail(to: string, userName: string, practiceName?: string) {
  const { subject, html } = getWelcomeEmail({
    userName,
    practiceName,
    dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://verimedrix.com"}/dashboard`,
  });

  return sendEmail({ to, subject, html });
}

// Convenience function to send task assignment email
export async function sendTaskAssignmentNotification(
  to: string,
  recipientName: string,
  taskTitle: string,
  taskDescription: string,
  dueDate: string,
  dueTime?: string
) {
  const { subject, html } = getTaskAssignmentEmail({
    recipientName,
    taskTitle,
    taskDescription,
    dueDate,
    dueTime,
    taskUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://verimedrix.com"}/tasks`,
  });

  return sendEmail({ to, subject, html });
}

// Account Deleted Email Template (confirmation after permanent deletion)
export function getAccountDeletedEmail({
  userName,
  practiceName,
}: {
  userName: string;
  practiceName: string;
}) {
  return {
    subject: `Your VeriMedrix account has been deleted`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #64748B 0%, #475569 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">VeriMedrix</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Account Deleted</p>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p>Hi ${userName},</p>

    <p>This email confirms that your VeriMedrix account for <strong>${practiceName}</strong> has been permanently deleted.</p>

    <div style="background: #F1F5F9; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #E2E8F0;">
      <h3 style="margin: 0 0 10px 0; color: #475569;">What was deleted:</h3>
      <ul style="margin: 0; padding-left: 20px; color: #64748B;">
        <li style="margin-bottom: 8px;">All practice data and settings</li>
        <li style="margin-bottom: 8px;">Employee records and documents</li>
        <li style="margin-bottom: 8px;">Payroll history and reports</li>
        <li style="margin-bottom: 8px;">Tasks, schedules, and compliance data</li>
        <li style="margin-bottom: 8px;">All team member accounts</li>
      </ul>
    </div>

    <p>Your subscription has been cancelled and you will not be charged again.</p>

    <div style="background: #F0F9FF; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #BAE6FD;">
      <h3 style="margin: 0 0 10px 0; color: #1E40AF;">Want to come back?</h3>
      <p style="margin: 0; color: #475569;">
        You're always welcome to create a new account at <a href="https://verimedrix.com" style="color: #1E40AF;">verimedrix.com</a> if you need OHSC compliance management in the future.
      </p>
    </div>

    <p style="font-size: 14px; color: #64748B; margin-top: 30px;">
      Thank you for using VeriMedrix. We hope we were able to help with your compliance needs.
    </p>
  </div>

  <div style="background: #F8FAFC; padding: 20px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
    <p style="margin: 0; font-size: 12px; color: #64748B;">
      © ${new Date().getFullYear()} VeriMedrix. All rights reserved.
    </p>
  </div>
</body>
</html>
    `,
  };
}

// Convenience function to send account deleted confirmation email
export async function sendAccountDeletedEmail(
  to: string,
  userName: string,
  practiceName: string
) {
  const { subject, html } = getAccountDeletedEmail({
    userName,
    practiceName,
  });

  return sendEmail({ to, subject, html });
}

// Weekly Digest Email Template
export function getWeeklyDigestEmail({
  userName,
  practiceName,
  dashboardUrl,
  expiringDocuments,
  pendingTasks,
  overdueTasks,
  complianceScore,
}: {
  userName: string;
  practiceName: string;
  dashboardUrl: string;
  expiringDocuments: { name: string; daysUntil: number }[];
  pendingTasks: number;
  overdueTasks: number;
  complianceScore: number;
}) {
  const hasAlerts = expiringDocuments.length > 0 || overdueTasks > 0;
  const scoreColor = complianceScore >= 80 ? "#059669" : complianceScore >= 60 ? "#D97706" : "#DC2626";

  const documentsList = expiringDocuments.length > 0
    ? expiringDocuments.map(doc => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">${doc.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; color: ${doc.daysUntil <= 7 ? '#DC2626' : doc.daysUntil <= 30 ? '#D97706' : '#059669'}; font-weight: bold;">${doc.daysUntil} days</td>
        </tr>
      `).join("")
    : "";

  return {
    subject: `Weekly Compliance Digest - ${practiceName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #10B981 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">VeriMedrix</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Weekly Compliance Digest</p>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p>Hello ${userName},</p>
    <p>Here's your weekly compliance summary for <strong>${practiceName}</strong>:</p>

    <!-- Compliance Score -->
    <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 10px 0; color: #64748B; font-size: 14px;">Overall Compliance Score</p>
      <div style="font-size: 48px; font-weight: bold; color: ${scoreColor};">${complianceScore}%</div>
    </div>

    <!-- Quick Stats -->
    <table style="width: 100%; margin: 20px 0;" cellpadding="0" cellspacing="10">
      <tr>
        <td style="background: ${pendingTasks > 0 ? '#FEF3C7' : '#D1FAE5'}; padding: 15px; border-radius: 8px; text-align: center; width: 33%;">
          <div style="font-size: 28px; font-weight: bold; color: ${pendingTasks > 0 ? '#D97706' : '#059669'};">${pendingTasks}</div>
          <div style="font-size: 12px; color: #64748B;">Pending Tasks</div>
        </td>
        <td style="background: ${overdueTasks > 0 ? '#FEE2E2' : '#D1FAE5'}; padding: 15px; border-radius: 8px; text-align: center; width: 33%;">
          <div style="font-size: 28px; font-weight: bold; color: ${overdueTasks > 0 ? '#DC2626' : '#059669'};">${overdueTasks}</div>
          <div style="font-size: 12px; color: #64748B;">Overdue Tasks</div>
        </td>
        <td style="background: ${expiringDocuments.length > 0 ? '#FEF3C7' : '#D1FAE5'}; padding: 15px; border-radius: 8px; text-align: center; width: 33%;">
          <div style="font-size: 28px; font-weight: bold; color: ${expiringDocuments.length > 0 ? '#D97706' : '#059669'};">${expiringDocuments.length}</div>
          <div style="font-size: 12px; color: #64748B;">Expiring Docs</div>
        </td>
      </tr>
    </table>

    ${expiringDocuments.length > 0 ? `
    <!-- Expiring Documents -->
    <div style="margin: 25px 0;">
      <h3 style="margin: 0 0 15px 0; color: #1E40AF;">Documents Expiring Soon</h3>
      <table style="width: 100%; border-collapse: collapse; background: #F8FAFC; border-radius: 8px;">
        <thead>
          <tr style="background: #E5E7EB;">
            <th style="padding: 10px; text-align: left; font-weight: 600;">Document</th>
            <th style="padding: 10px; text-align: left; font-weight: 600;">Expires In</th>
          </tr>
        </thead>
        <tbody>
          ${documentsList}
        </tbody>
      </table>
    </div>
    ` : ""}

    ${hasAlerts ? `
    <div style="background: #FEF3C7; border-left: 4px solid #D97706; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #92400E; font-weight: bold;">Action Required</p>
      <p style="margin: 5px 0 0 0; color: #78350F;">Please review and address the items above to maintain compliance.</p>
    </div>
    ` : `
    <div style="background: #D1FAE5; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #065F46; font-weight: bold;">Great Work!</p>
      <p style="margin: 5px 0 0 0; color: #047857;">Your practice is in good compliance standing. Keep it up!</p>
    </div>
    `}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; background: #1E40AF; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View Dashboard</a>
    </div>

    <p style="margin-top: 30px; font-size: 14px; color: #64748B;">
      This is your weekly compliance digest from VeriMedrix, sent every Monday.
    </p>
  </div>

  <div style="background: #F8FAFC; padding: 20px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
    <p style="margin: 0; font-size: 12px; color: #64748B;">
      &copy; ${new Date().getFullYear()} VeriMedrix. All rights reserved.
    </p>
    <p style="margin: 8px 0 0 0; font-size: 12px; color: #94a3b8;">
      You can manage your notification preferences in Settings.
    </p>
  </div>
</body>
</html>
    `,
  };
}
