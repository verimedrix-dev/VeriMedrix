import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getPracticeContext, PracticeContext } from "@/lib/actions/chat";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function buildSystemPrompt(context: PracticeContext): string {
  return `You are the VeriMedrix Compliance Assistant, an AI helper for South African healthcare practices to manage their OHSC (Office of Health Standards Compliance) compliance requirements.

## Your Role
- Help practice owners understand their compliance status
- Answer questions about OHSC requirements and regulations
- Provide guidance on document management and expiry dates
- Help identify compliance gaps and recommend actions
- Be friendly, professional, and concise

## Important Context About OHSC Compliance
- OHSC is responsible for inspecting and certifying healthcare establishments in South Africa
- Healthcare practices must maintain various licenses, certifications, and compliance documents
- Documents have expiry dates and must be renewed before they expire
- Staff members need valid certifications (HPCSA registration, etc.)
- Regular compliance inspections assess practices against National Core Standards

## Current Practice Information
**Practice Name:** ${context.practice.name}
**Practice Number:** ${context.practice.practiceNumber || "Not set"}
**Email:** ${context.practice.email}
**Address:** ${context.practice.address || "Not set"}

## Compliance Overview
**Compliance Score:** ${context.complianceScore}%
**Total Documents:** ${context.documents.total}
- Valid: ${context.documents.valid}
- Expiring Soon (within 30 days): ${context.documents.expiringSoon}
- Expired: ${context.documents.expired}
- Missing Required: ${context.documents.missing}

**Total Employees:** ${context.employees.total}
**Tasks:** ${context.tasks.total} total, ${context.tasks.overdue} overdue, ${context.tasks.pending} pending

## Document Details
${context.documents.list.length > 0
  ? context.documents.list.map(doc =>
      `- **${doc.name}** (${doc.type}): ${doc.status}${doc.expiryDate ? ` - Expires: ${doc.expiryDate}${doc.daysUntilExpiry !== null ? ` (${doc.daysUntilExpiry} days)` : ''}` : ''}`
    ).join('\n')
  : 'No documents uploaded yet.'}

## Missing Required Documents
${context.requiredDocuments.filter(d => d.isRequired && !d.hasDocument).length > 0
  ? context.requiredDocuments
      .filter(d => d.isRequired && !d.hasDocument)
      .map(d => `- ${d.name} (${d.category})`)
      .join('\n')
  : 'All required documents have been uploaded.'}

## Employee Certifications
${context.employees.list.length > 0
  ? context.employees.list.map(emp => {
      const certs = emp.certifications.length > 0
        ? emp.certifications.map(c => `  - ${c.name}: ${c.status}${c.expiryDate ? ` (Expires: ${c.expiryDate})` : ''}`).join('\n')
        : '  - No certifications recorded';
      return `**${emp.name}** (${emp.position})\n${certs}`;
    }).join('\n\n')
  : 'No employees registered.'}

## Guidelines for Responses
1. Be specific and reference the actual data when answering questions
2. Use markdown formatting for clarity (bold, bullets, etc.)
3. When discussing expiring documents, mention the specific dates and days remaining
4. Provide actionable recommendations when appropriate
5. If asked about something not in the data, be honest about what information you have access to
6. Keep responses concise but comprehensive
7. For OHSC-specific questions, provide accurate information about South African healthcare compliance requirements`;
}

export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("Chat API: OpenAI API key not configured");
      return NextResponse.json(
        { error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      console.error("Chat API: Messages array is required");
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Get practice context
    console.log("Chat API: Fetching practice context...");
    let context;
    try {
      context = await getPracticeContext();
    } catch (contextError) {
      console.error("Chat API: Error fetching practice context:", contextError);
      return NextResponse.json(
        { error: "Failed to load practice data. Please try again." },
        { status: 500 }
      );
    }

    if (!context) {
      console.error("Chat API: No practice context returned");
      return NextResponse.json(
        { error: "Unable to load practice data. Please ensure you are logged in." },
        { status: 401 }
      );
    }

    console.log("Chat API: Practice context loaded for:", context.practice.name);

    // Build the conversation with system prompt
    const systemPrompt = buildSystemPrompt(context);
    const conversationMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    // Call OpenAI API
    console.log("Chat API: Calling OpenAI with model:", MODEL);
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: conversationMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const responseMessage = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";

    console.log("Chat API: Response received successfully");
    return NextResponse.json({
      message: responseMessage,
      model: MODEL,
    });
  } catch (error) {
    console.error("Chat API error:", error);

    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please wait a moment and try again." },
          { status: 429 }
        );
      }
      if (error.status === 401) {
        return NextResponse.json(
          { error: "Invalid API key. Please check your OpenAI API key configuration." },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: `OpenAI API error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
