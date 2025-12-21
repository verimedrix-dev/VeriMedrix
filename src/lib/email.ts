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
    <p style="font-size: 16px;">Hi ${userName || "there"},</p>

    <p style="font-size: 16px;">Thank you for signing up for VeriMedrix${practiceName ? ` with <strong>${practiceName}</strong>` : ""}. We're excited to help you streamline your OHSC compliance management!</p>

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
