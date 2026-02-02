// Template definition types for document template PDF generation

export type TemplateType = "audit-form" | "checklist" | "policy" | "log";

export type FieldWidth = "full" | "half";

export type HeaderField = {
  label: string;
  type: "text";
  autofill?: "practiceName";
  width: FieldWidth;
};

export type DescriptionSection = {
  type: "description";
  heading?: string;
  content: string;
};

export type HeaderFieldsSection = {
  type: "header-fields";
  fields: HeaderField[];
};

export type ChecklistTableSection = {
  type: "checklist-table";
  heading?: string;
  columns: string[];
  columnWidths: string[];
  items: string[];
};

export type TextAreaSection = {
  type: "text-area";
  label: string;
  sublabel?: string;
  lines: number;
};

export type SignatureEntry = {
  label: string;
  sublabel?: string;
  fields: string[];
};

export type SignatureBlockSection = {
  type: "signature-block";
  signatures: SignatureEntry[];
};

export type TemplateSection =
  | DescriptionSection
  | HeaderFieldsSection
  | ChecklistTableSection
  | TextAreaSection
  | SignatureBlockSection;

export type TemplateVariant = {
  name: string;
  title: string;
  subtitle?: string;
  sections: TemplateSection[];
};

export type TemplateDefinition = {
  version: string;
  type: TemplateType;
  title: string;
  subtitle?: string;
  sections: TemplateSection[];
  variants?: TemplateVariant[];
};
