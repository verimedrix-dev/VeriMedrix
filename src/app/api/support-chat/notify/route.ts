import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { getCurrentUser } from "@/lib/actions/practice";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.verimedrix.com";

function getSupportTicketEmailHtml({
  ticketId,
  subject,
  userName,
  userEmail,
  practiceName,
}: {
  ticketId: string;
  subject: string;
  userName: string;
  userEmail: string;
  practiceName: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#10b981,#059669);padding:30px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;">New Support Ticket</h1>
      <p style="color:#d1fae5;margin:8px 0 0;font-size:14px;">A user needs assistance</p>
    </div>
    <div style="background:#ffffff;padding:30px;border:1px solid #e2e8f0;border-top:none;">
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:20px;">
        <p style="margin:0;color:#166534;font-weight:600;font-size:14px;">Ticket Details</p>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#64748b;font-size:14px;width:120px;">Subject:</td>
          <td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:500;">${subject}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748b;font-size:14px;">User:</td>
          <td style="padding:8px 0;color:#1e293b;font-size:14px;">${userName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748b;font-size:14px;">Email:</td>
          <td style="padding:8px 0;color:#1e293b;font-size:14px;">${userEmail}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748b;font-size:14px;">Practice:</td>
          <td style="padding:8px 0;color:#1e293b;font-size:14px;">${practiceName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748b;font-size:14px;">Source:</td>
          <td style="padding:8px 0;color:#1e293b;font-size:14px;">Support Chat</td>
        </tr>
      </table>
      <div style="text-align:center;margin-top:24px;">
        <a href="${APP_URL}/admin/support/${ticketId}" style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#ffffff;text-decoration:none;padding:12px 30px;border-radius:8px;font-weight:600;font-size:14px;">
          View Ticket in Admin
        </a>
      </div>
    </div>
    <div style="text-align:center;padding:20px;color:#94a3b8;font-size:12px;">
      <p style="margin:0;">&copy; ${new Date().getFullYear()} VeriMedrix. This is an automated notification.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId, subject } = body;

    if (!ticketId || !subject) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let userName = "Unknown User";
    let userEmail = "unknown";
    let practiceName = "Unknown Practice";

    try {
      const user = await getCurrentUser();
      if (user) {
        userName = user.name || user.email;
        userEmail = user.email;
        practiceName = user.Practice?.name || "Unknown Practice";
      }
    } catch {
      // Continue with defaults
    }

    const html = getSupportTicketEmailHtml({
      ticketId,
      subject,
      userName,
      userEmail,
      practiceName,
    });

    await sendEmail({
      to: "admin@verimedrix.com",
      subject: `New Support Ticket: ${subject.slice(0, 60)}`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Support ticket notification email error:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
