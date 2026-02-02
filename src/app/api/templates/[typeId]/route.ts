import { NextRequest, NextResponse } from "next/server";
import { Packer } from "docx";
import { prisma } from "@/lib/prisma";
import { ensureUserAndPractice } from "@/lib/actions/practice";
import { generateAuditFormDocx } from "@/lib/templates/audit-form-template";
import type { TemplateDefinition } from "@/lib/templates/template-types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ typeId: string }> }
) {
  try {
    const { typeId } = await params;

    // Authenticate
    const { user, practice } = await ensureUserAndPractice();
    if (!user || !practice) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch document type with template
    const docType = await prisma.documentType.findUnique({
      where: { id: typeId },
      select: {
        id: true,
        name: true,
        hasTemplate: true,
        templateDefinition: true,
      },
    });

    if (!docType || !docType.hasTemplate || !docType.templateDefinition) {
      return NextResponse.json(
        { error: "Template not found for this document type" },
        { status: 404 }
      );
    }

    const definition = docType.templateDefinition as unknown as TemplateDefinition;

    // Handle variant selection
    let effectiveDefinition = definition;
    let variantName = "";
    const variantParam = request.nextUrl.searchParams.get("variant");

    if (definition.variants && definition.variants.length > 0) {
      const variantIndex = variantParam ? parseInt(variantParam, 10) : 0;
      if (isNaN(variantIndex) || variantIndex < 0 || variantIndex >= definition.variants.length) {
        return NextResponse.json(
          { error: "Invalid variant index" },
          { status: 400 }
        );
      }
      const variant = definition.variants[variantIndex];
      variantName = variant.name;
      effectiveDefinition = {
        ...definition,
        title: variant.title,
        subtitle: variant.subtitle,
        sections: variant.sections,
      };
    }

    // Generate DOCX based on template type
    let doc;
    switch (effectiveDefinition.type) {
      case "audit-form":
        doc = generateAuditFormDocx(effectiveDefinition, practice.name);
        break;
      default:
        doc = generateAuditFormDocx(effectiveDefinition, practice.name);
        break;
    }

    const buffer = await Packer.toBuffer(doc);

    // Sanitize filename
    const baseName = variantName || docType.name;
    const fileName = baseName.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "_");

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName}_Template.docx"`,
      },
    });
  } catch (error) {
    console.error("Template generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate template" },
      { status: 500 }
    );
  }
}
