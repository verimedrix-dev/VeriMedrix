import {
  Document,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
  HeadingLevel,
  TableLayoutType,
  VerticalAlign,
} from "docx";
import type {
  TemplateDefinition,
  DescriptionSection,
  HeaderFieldsSection,
  ChecklistTableSection,
  TextAreaSection,
  SignatureBlockSection,
} from "./template-types";

const COLORS = {
  dark: "1e293b",
  medium: "475569",
  light: "94a3b8",
  border: "cbd5e1",
  headerBg: "1e293b",
  altRowBg: "f1f5f9",
  white: "ffffff",
  brand: "0ea5e9",
};

const noBorders = {
  top: { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left: { style: BorderStyle.NONE, size: 0 },
  right: { style: BorderStyle.NONE, size: 0 },
};

const thinBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
  left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
  right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
};

function renderDescription(section: DescriptionSection): Paragraph[] {
  const elements: Paragraph[] = [];

  if (section.heading) {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: section.heading,
            bold: true,
            size: 22,
            color: COLORS.dark,
          }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );
  }

  // Support multi-line content with bullet points
  const lines = section.content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isBullet = line.startsWith("- ") || line.startsWith("* ");
    const text = isBullet ? line.slice(2) : line;
    const isLast = i === lines.length - 1;

    elements.push(
      new Paragraph({
        children: [
          ...(isBullet
            ? [
                new TextRun({
                  text: "\u2022  ",
                  size: 18,
                  color: COLORS.dark,
                }),
              ]
            : []),
          new TextRun({
            text,
            size: 18,
            color: COLORS.medium,
          }),
        ],
        indent: isBullet ? { left: 360 } : undefined,
        spacing: { after: isLast ? 200 : 60 },
      })
    );
  }

  return elements;
}

function renderHeaderFields(
  section: HeaderFieldsSection,
  practiceName: string
): Table {
  const rows: TableRow[] = [];

  // Group fields into rows
  const fieldRows: Array<typeof section.fields> = [];
  let currentRow: typeof section.fields = [];

  for (const field of section.fields) {
    if (field.width === "full") {
      if (currentRow.length > 0) {
        fieldRows.push(currentRow);
        currentRow = [];
      }
      fieldRows.push([field]);
    } else {
      currentRow.push(field);
      if (currentRow.length === 2) {
        fieldRows.push(currentRow);
        currentRow = [];
      }
    }
  }
  if (currentRow.length > 0) fieldRows.push(currentRow);

  for (const fieldRow of fieldRows) {
    const cells: TableCell[] = [];

    for (const field of fieldRow) {
      const value = field.autofill === "practiceName" ? practiceName : "";
      const colSpan = field.width === "full" && fieldRow.length === 1 ? 2 : 1;

      cells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${field.label}: `,
                  bold: true,
                  size: 20,
                  color: COLORS.dark,
                }),
                new TextRun({
                  text: value,
                  size: 20,
                  color: COLORS.dark,
                }),
              ],
            }),
          ],
          columnSpan: colSpan,
          borders: {
            ...noBorders,
            bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
          },
          verticalAlign: VerticalAlign.BOTTOM,
          width: { size: 50, type: WidthType.PERCENTAGE },
        })
      );
    }

    // If only one half-width field, add empty cell
    if (fieldRow.length === 1 && fieldRow[0].width === "half") {
      cells.push(
        new TableCell({
          children: [new Paragraph("")],
          borders: noBorders,
          width: { size: 50, type: WidthType.PERCENTAGE },
        })
      );
    }

    rows.push(new TableRow({ children: cells }));
  }

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
  });
}

function renderChecklistTable(section: ChecklistTableSection): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  if (section.heading) {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: section.heading,
            bold: true,
            size: 22,
            color: COLORS.dark,
          }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );
  }

  // Column widths in percentages
  const widths = section.columnWidths.map((w) => parseInt(w));

  // Header row
  const headerCells = section.columns.map(
    (col, i) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: col,
                bold: true,
                size: 18,
                color: COLORS.white,
              }),
            ],
            alignment: i > 0 && i < section.columns.length - 1
              ? AlignmentType.CENTER
              : AlignmentType.LEFT,
          }),
        ],
        shading: {
          type: ShadingType.SOLID,
          color: COLORS.headerBg,
          fill: COLORS.headerBg,
        },
        borders: thinBorders,
        width: { size: widths[i], type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
      })
  );

  const tableRows: TableRow[] = [new TableRow({ children: headerCells })];

  // Data rows
  for (let i = 0; i < section.items.length; i++) {
    const isAlt = i % 2 === 1;
    const rowCells: TableCell[] = [];

    // Item cell
    rowCells.push(
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: section.items[i],
                size: 18,
                color: COLORS.dark,
              }),
            ],
          }),
        ],
        borders: thinBorders,
        width: { size: widths[0], type: WidthType.PERCENTAGE },
        shading: isAlt
          ? { type: ShadingType.SOLID, color: COLORS.altRowBg, fill: COLORS.altRowBg }
          : undefined,
        verticalAlign: VerticalAlign.CENTER,
      })
    );

    // Yes/No/N/A/Comments cells
    for (let ci = 1; ci < section.columns.length; ci++) {
      rowCells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "",
                  size: 18,
                }),
              ],
              alignment: ci < section.columns.length - 1
                ? AlignmentType.CENTER
                : AlignmentType.LEFT,
            }),
          ],
          borders: thinBorders,
          width: { size: widths[ci], type: WidthType.PERCENTAGE },
          shading: isAlt
            ? { type: ShadingType.SOLID, color: COLORS.altRowBg, fill: COLORS.altRowBg }
            : undefined,
          verticalAlign: VerticalAlign.CENTER,
        })
      );
    }

    tableRows.push(new TableRow({ children: rowCells }));
  }

  elements.push(
    new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
    })
  );

  return elements;
}

function renderTextArea(section: TextAreaSection): Paragraph[] {
  const elements: Paragraph[] = [];

  elements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: section.label,
          bold: true,
          size: 22,
          color: COLORS.dark,
        }),
      ],
      spacing: { before: 300, after: 40 },
    })
  );

  if (section.sublabel) {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: section.sublabel,
            size: 16,
            color: COLORS.light,
            italics: true,
          }),
        ],
        spacing: { after: 80 },
      })
    );
  }

  // Blank lines for writing
  for (let i = 0; i < section.lines; i++) {
    elements.push(
      new Paragraph({
        children: [new TextRun({ text: "", size: 20 })],
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        },
        spacing: { after: 200 },
      })
    );
  }

  return elements;
}

function renderSignatureBlock(section: SignatureBlockSection): Table {
  const rows: TableRow[] = [];

  for (const sig of section.signatures) {
    const cells: TableCell[] = [];

    // Label cell
    const labelRuns: TextRun[] = [
      new TextRun({
        text: sig.label,
        bold: true,
        size: 20,
        color: COLORS.dark,
      }),
    ];
    if (sig.sublabel) {
      labelRuns.push(
        new TextRun({
          text: ` ${sig.sublabel}`,
          size: 16,
          color: COLORS.light,
        })
      );
    }

    cells.push(
      new TableCell({
        children: [new Paragraph({ children: labelRuns })],
        borders: thinBorders,
        width: { size: 40, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
      })
    );

    // Field cells
    for (const field of sig.fields) {
      cells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${field}:`,
                  size: 18,
                  color: COLORS.light,
                }),
              ],
            }),
          ],
          borders: thinBorders,
          width: {
            size: Math.floor(60 / sig.fields.length),
            type: WidthType.PERCENTAGE,
          },
          verticalAlign: VerticalAlign.CENTER,
        })
      );
    }

    rows.push(new TableRow({ children: cells, height: { value: 600, rule: "atLeast" as const } }));
  }

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
  });
}

export function generateAuditFormDocx(
  definition: TemplateDefinition,
  practiceName: string
): Document {
  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: definition.title,
          bold: true,
          size: 32,
          color: COLORS.dark,
        }),
      ],
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 80 },
    })
  );

  // Subtitle
  if (definition.subtitle) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: definition.subtitle,
            size: 24,
            color: COLORS.medium,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.dark },
        },
      })
    );
  }

  // Sections
  for (const section of definition.sections) {
    switch (section.type) {
      case "description":
        children.push(...renderDescription(section));
        break;
      case "header-fields":
        children.push(renderHeaderFields(section, practiceName));
        children.push(new Paragraph({ spacing: { after: 200 } }));
        break;
      case "checklist-table":
        children.push(...renderChecklistTable(section));
        break;
      case "text-area":
        children.push(...renderTextArea(section));
        break;
      case "signature-block":
        children.push(
          new Paragraph({ spacing: { before: 200 } }),
          renderSignatureBlock(section)
        );
        break;
    }
  }

  // Footer
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "This is a template document. Please complete all fields and upload.",
          size: 14,
          color: COLORS.light,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
      },
    })
  );

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              bottom: 720,
              left: 720,
              right: 720,
            },
          },
        },
        children,
      },
    ],
  });
}
