-- Add Hand Hygiene Audit Tool Template
-- This script adds a template definition to the Hand Hygiene Protocol document type (IPC-2)

-- Update the document type to enable templates and add the template definition
UPDATE "DocumentType"
SET
  "hasTemplate" = true,
  "templateDefinition" = '{
    "version": "1.0",
    "type": "audit-form",
    "title": "HAND HYGIENE AUDIT TOOL",
    "subtitle": "Infection Prevention & Control (OHSC)",
    "sections": [
      {
        "type": "description",
        "heading": "Standard Operating Procedure (SOP) Summary",
        "content": "This audit tool is designed to assess compliance with hand hygiene protocols as required by OHSC Infection Prevention and Control standards (IPC-2). Regular audits ensure proper hand hygiene practices are maintained to prevent healthcare-associated infections.\n\nAudit Frequency: Monthly minimum\nCompliance Target: 95% or higher\nNon-compliance requires immediate corrective action"
      },
      {
        "type": "header-fields",
        "fields": [
          {
            "label": "Practice Name",
            "type": "text",
            "autofill": "practiceName",
            "width": "full"
          },
          {
            "label": "Audit Month",
            "type": "text",
            "width": "half"
          },
          {
            "label": "Audit Date",
            "type": "text",
            "width": "half"
          },
          {
            "label": "Audit Time",
            "type": "text",
            "width": "half"
          },
          {
            "label": "Area Audited",
            "type": "text",
            "width": "half"
          },
          {
            "label": "Auditor Name",
            "type": "text",
            "width": "half"
          },
          {
            "label": "Auditor Role",
            "type": "text",
            "width": "half"
          }
        ]
      },
      {
        "type": "checklist-table",
        "heading": "Hand Hygiene Compliance Checklist",
        "columns": ["Item", "Yes", "No", "N/A", "Comments"],
        "columnWidths": ["40", "8", "8", "8", "36"],
        "items": [
          "1. Running water available at all hand washing stations",
          "2. Liquid soap dispensers present and functional",
          "3. Soap dispensers adequately stocked",
          "4. Paper towels or hand dryers available and functional",
          "5. Waste bins present and within reach",
          "6. Alcohol-based hand sanitizer available at point of care",
          "7. Hand hygiene signage visible at washing stations",
          "8. WHO 5 Moments for Hand Hygiene poster displayed",
          "9. Hand hygiene technique poster visible",
          "10. Staff observed performing hand hygiene before patient contact",
          "11. Staff observed performing hand hygiene after patient contact",
          "12. Staff using correct hand hygiene technique (20+ seconds)"
        ]
      },
      {
        "type": "text-area",
        "label": "Corrective Actions Required",
        "sublabel": "List any non-compliance issues identified and actions needed to address them",
        "lines": 5
      },
      {
        "type": "signature-block",
        "signatures": [
          {
            "label": "Audit Conducted By",
            "fields": ["Name", "Signature", "Date"]
          },
          {
            "label": "Reviewed & Authorised By",
            "sublabel": "(Practice Manager/IPC Lead)",
            "fields": ["Name", "Signature", "Date"]
          }
        ]
      }
    ]
  }'::jsonb,
  "updatedAt" = NOW()
WHERE "ohscMeasureNumber" = 'IPC-2';

-- Verify the update
SELECT
  id,
  name,
  "ohscMeasureNumber",
  "hasTemplate",
  CASE
    WHEN "templateDefinition" IS NOT NULL THEN 'Template defined'
    ELSE 'No template'
  END as template_status
FROM "DocumentType"
WHERE "ohscMeasureNumber" = 'IPC-2';
