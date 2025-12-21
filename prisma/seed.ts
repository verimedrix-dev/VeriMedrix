import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

interface DocumentTypeDefinition {
  name: string;
  isRequired: boolean;
  requiresExpiry: boolean;
  ohscMeasureNumber: string;
  description?: string;
  defaultReviewMonths?: number;
}

interface DocumentCategoryDefinition {
  name: string;
  description: string;
  displayOrder: number;
  icon: string;
  types: DocumentTypeDefinition[];
}

// Document categories and types based on OHSC requirements
const documentCategories: DocumentCategoryDefinition[] = [
  {
    name: "Licenses & Certificates",
    description: "Legal licenses and compliance certificates required for practice operation",
    displayOrder: 1,
    icon: "Award",
    types: [
      { name: "Facility License Certificate", isRequired: true, requiresExpiry: true, ohscMeasureNumber: "1.1.1" },
      { name: "Practice Registration Certificate (HPCSA)", isRequired: true, requiresExpiry: true, ohscMeasureNumber: "1.1.2" },
      { name: "Professional Indemnity Certificates", isRequired: true, requiresExpiry: true, ohscMeasureNumber: "1.1.3" },
      { name: "COIDA Registration Certificate", isRequired: true, requiresExpiry: true, ohscMeasureNumber: "1.1.4" },
      { name: "Fire Safety Compliance Certificate", isRequired: true, requiresExpiry: true, ohscMeasureNumber: "1.1.5" },
      { name: "Electrical Compliance Certificate (COC)", isRequired: true, requiresExpiry: true, ohscMeasureNumber: "1.1.6" },
      { name: "Dispensing License", isRequired: false, requiresExpiry: true, ohscMeasureNumber: "1.1.7", description: "Required if practice dispenses medication" },
    ],
  },
  {
    name: "Policies & Standard Operating Procedures",
    description: "Organizational policies and procedures for practice operations",
    displayOrder: 2,
    icon: "FileText",
    types: [
      { name: "Infection Prevention & Control (IPC) Policy", isRequired: true, requiresExpiry: false, defaultReviewMonths: 60, ohscMeasureNumber: "2.1.1" },
      { name: "Waste Management Policy", isRequired: true, requiresExpiry: false, defaultReviewMonths: 60, ohscMeasureNumber: "2.1.2" },
      { name: "Health & Safety Policy", isRequired: true, requiresExpiry: false, defaultReviewMonths: 60, ohscMeasureNumber: "2.1.3" },
      { name: "Fire Safety & Evacuation Plan", isRequired: true, requiresExpiry: false, defaultReviewMonths: 60, ohscMeasureNumber: "2.1.4" },
      { name: "Complaints Management Policy", isRequired: true, requiresExpiry: false, defaultReviewMonths: 60, ohscMeasureNumber: "2.1.5" },
      { name: "Patient Referral Policy", isRequired: true, requiresExpiry: false, defaultReviewMonths: 60, ohscMeasureNumber: "2.1.6" },
      { name: "Patient Records Policy", isRequired: true, requiresExpiry: false, defaultReviewMonths: 60, ohscMeasureNumber: "2.1.7" },
      { name: "Record Storage & Confidentiality Policy", isRequired: true, requiresExpiry: false, defaultReviewMonths: 60, ohscMeasureNumber: "2.1.8" },
      { name: "Appointment & Queue Management Policy", isRequired: true, requiresExpiry: false, defaultReviewMonths: 60, ohscMeasureNumber: "2.1.9" },
      { name: "Medicine Management Policy", isRequired: true, requiresExpiry: false, defaultReviewMonths: 60, ohscMeasureNumber: "2.1.10" },
      { name: "Business Continuity Plan", isRequired: true, requiresExpiry: false, defaultReviewMonths: 60, ohscMeasureNumber: "2.1.11" },
      { name: "Infection Outbreak Response Plan", isRequired: true, requiresExpiry: false, defaultReviewMonths: 60, ohscMeasureNumber: "2.1.12" },
    ],
  },
  {
    name: "Standard Operating Procedures (SOPs)",
    description: "Detailed procedures for specific clinical and operational tasks",
    displayOrder: 3,
    icon: "ClipboardList",
    types: [
      { name: "SOP: Complaints Management", isRequired: true, requiresExpiry: false, defaultReviewMonths: 60, ohscMeasureNumber: "3.1.1" },
      { name: "SOP: Prioritising Urgent Care", isRequired: true, requiresExpiry: false, defaultReviewMonths: 60, ohscMeasureNumber: "3.1.2" },
      { name: "SOP: Informed Consent", isRequired: true, requiresExpiry: false, defaultReviewMonths: 60, ohscMeasureNumber: "3.1.3" },
      { name: "SOP: Health Records Management", isRequired: true, requiresExpiry: false, defaultReviewMonths: 60, ohscMeasureNumber: "3.1.4" },
      { name: "SOP: Safe Injection Practices", isRequired: true, requiresExpiry: false, defaultReviewMonths: 60, ohscMeasureNumber: "3.1.5" },
      { name: "SOP: Invasive Procedures", isRequired: true, requiresExpiry: false, defaultReviewMonths: 60, ohscMeasureNumber: "3.1.6" },
      { name: "SOP: Conducting Research", isRequired: false, requiresExpiry: false, defaultReviewMonths: 60, ohscMeasureNumber: "3.1.7", description: "Required if practice conducts research" },
      { name: "SOP: Decontamination Processes", isRequired: true, requiresExpiry: false, defaultReviewMonths: 60, ohscMeasureNumber: "3.1.8" },
      { name: "SOP: Waste Management", isRequired: true, requiresExpiry: false, defaultReviewMonths: 60, ohscMeasureNumber: "3.1.9" },
      { name: "SOP: Managing Adverse Drug Reactions", isRequired: true, requiresExpiry: false, defaultReviewMonths: 60, ohscMeasureNumber: "3.1.10" },
    ],
  },
  {
    name: "Registers & Logs",
    description: "Required registers and logs for tracking compliance activities",
    displayOrder: 4,
    icon: "BookOpen",
    types: [
      { name: "Complaints Register", isRequired: true, requiresExpiry: false, ohscMeasureNumber: "4.1.1" },
      { name: "Incident & Adverse Event Register", isRequired: true, requiresExpiry: false, ohscMeasureNumber: "4.1.2" },
      { name: "Temperature Monitoring Logs (Fridge)", isRequired: true, requiresExpiry: false, ohscMeasureNumber: "4.1.3" },
      { name: "Schedule 5+ Controlled Substance Register", isRequired: true, requiresExpiry: false, ohscMeasureNumber: "4.1.4" },
      { name: "Stock Inventory Register", isRequired: true, requiresExpiry: false, ohscMeasureNumber: "4.1.5" },
      { name: "Equipment Maintenance Log", isRequired: true, requiresExpiry: false, ohscMeasureNumber: "4.1.6" },
    ],
  },
  {
    name: "HR & Staff Documents",
    description: "Human resources and staff-related compliance documents",
    displayOrder: 5,
    icon: "Users",
    types: [
      { name: "Human Resource Files for All Staff", isRequired: true, requiresExpiry: false, ohscMeasureNumber: "5.1.1" },
      { name: "Job Descriptions for All Staff", isRequired: true, requiresExpiry: false, ohscMeasureNumber: "5.1.2" },
      { name: "Appointment Letters for Key Personnel", isRequired: true, requiresExpiry: false, ohscMeasureNumber: "5.1.3" },
      { name: "Staff Training Records (BLS, IPC, H&S)", isRequired: true, requiresExpiry: false, ohscMeasureNumber: "5.1.4" },
      { name: "Staff Immunisation Records", isRequired: true, requiresExpiry: false, ohscMeasureNumber: "5.1.5" },
    ],
  },
  {
    name: "Quality & Safety",
    description: "Quality improvement and safety management documents",
    displayOrder: 6,
    icon: "Shield",
    types: [
      { name: "Emergency Equipment Weekly Checklists", isRequired: true, requiresExpiry: false, ohscMeasureNumber: "6.1.1" },
      { name: "Clinical SOPs (triage, emergencies, chronic care)", isRequired: true, requiresExpiry: false, defaultReviewMonths: 60, ohscMeasureNumber: "6.1.2" },
      { name: "Patient Consent Forms (templates)", isRequired: true, requiresExpiry: false, ohscMeasureNumber: "6.1.3" },
      { name: "Clinical Audits (File Audits, Prescribing Audits)", isRequired: true, requiresExpiry: false, ohscMeasureNumber: "6.1.4" },
      { name: "Quality Improvement Plan", isRequired: true, requiresExpiry: false, defaultReviewMonths: 12, ohscMeasureNumber: "6.1.5" },
      { name: "Risk Register", isRequired: true, requiresExpiry: false, defaultReviewMonths: 12, ohscMeasureNumber: "6.1.6" },
      { name: "Occupational Health & Safety Risk Assessment", isRequired: true, requiresExpiry: false, defaultReviewMonths: 24, ohscMeasureNumber: "6.1.7" },
      { name: "Patient Satisfaction Surveys & Analysis", isRequired: true, requiresExpiry: false, ohscMeasureNumber: "6.1.8" },
      { name: "Referral Directory", isRequired: true, requiresExpiry: false, ohscMeasureNumber: "6.1.9" },
      { name: "OHSC Self-Assessment Checklist", isRequired: true, requiresExpiry: false, ohscMeasureNumber: "6.1.10" },
    ],
  },
  {
    name: "Service Agreements",
    description: "Contracts and service level agreements with external providers",
    displayOrder: 7,
    icon: "FileSignature",
    types: [
      { name: "Service Level Agreements with Contractors (Waste, Decontamination, etc.)", isRequired: true, requiresExpiry: true, ohscMeasureNumber: "7.1.1" },
    ],
  },
];

// Default task templates based on OHSC requirements
const defaultTaskTemplates = [
  // Multiple Daily
  { name: "Temperature Monitoring - Morning", frequency: "MULTIPLE_DAILY", category: "Monitoring", description: "Record fridge temperature readings (morning check)" },
  { name: "Temperature Monitoring - Midday", frequency: "MULTIPLE_DAILY", category: "Monitoring", description: "Record fridge temperature readings (midday check)" },
  { name: "Temperature Monitoring - Afternoon", frequency: "MULTIPLE_DAILY", category: "Monitoring", description: "Record fridge temperature readings (afternoon check)" },
  { name: "Temperature Monitoring - Evening", frequency: "MULTIPLE_DAILY", category: "Monitoring", description: "Record fridge temperature readings (evening check)" },

  // Daily
  { name: "Daily Cleaning Log", frequency: "DAILY", category: "Hygiene", description: "Complete and sign daily cleaning checklist", requiresEvidence: true },
  { name: "Waste Segregation Check", frequency: "DAILY", category: "Waste Management", description: "Verify waste is correctly segregated into appropriate bins" },
  { name: "Hand Hygiene Station Check", frequency: "DAILY", category: "Hygiene", description: "Ensure all hand hygiene stations are stocked and functional" },

  // Weekly
  { name: "Emergency Equipment/Trolley Check", frequency: "WEEKLY", category: "Safety", description: "Complete weekly emergency equipment checklist", requiresEvidence: true },
  { name: "Sharps Container Inspection", frequency: "WEEKLY", category: "Waste Management", description: "Check sharps containers are not overfilled and properly labeled" },
  { name: "First Aid Kit Check", frequency: "WEEKLY", category: "Safety", description: "Verify first aid kit contents are complete and not expired" },

  // Monthly
  { name: "Stock Inventory Review", frequency: "MONTHLY", category: "Inventory", description: "Complete monthly stock inventory count and review" },
  { name: "Fire Extinguisher Visual Check", frequency: "MONTHLY", category: "Safety", description: "Visual inspection of all fire extinguishers" },
  { name: "Equipment Maintenance Check", frequency: "MONTHLY", category: "Maintenance", description: "Review equipment maintenance log and schedule services" },

  // Quarterly
  { name: "Clinical File Audit", frequency: "QUARTERLY", category: "Quality", description: "Conduct clinical file audit on sample of patient records" },
  { name: "Prescribing Audit", frequency: "QUARTERLY", category: "Quality", description: "Conduct prescribing audit and review results" },
  { name: "Complaints Review", frequency: "QUARTERLY", category: "Quality", description: "Review complaints register and identify trends" },

  // Bi-annually
  { name: "SLA Compliance Review", frequency: "BIANNUALLY", category: "Compliance", description: "Review all service level agreements for compliance" },

  // Annually
  { name: "Annual Risk Assessment Review", frequency: "ANNUALLY", category: "Safety", description: "Review and update practice risk assessment" },
  { name: "Fire Safety Drill", frequency: "ANNUALLY", category: "Safety", description: "Conduct annual fire evacuation drill", requiresEvidence: true },
  { name: "Certificate Renewals Check", frequency: "ANNUALLY", category: "Compliance", description: "Review all certificate expiry dates and plan renewals" },

  // Every 2 Years
  { name: "BLS/CPR Recertification", frequency: "EVERY_TWO_YEARS", category: "Training", description: "Ensure all clinical staff have current BLS certification" },
  { name: "OHS Risk Assessment Update", frequency: "EVERY_TWO_YEARS", category: "Safety", description: "Conduct comprehensive occupational health and safety risk assessment" },

  // Every 5 Years
  { name: "SOP Review and Update", frequency: "EVERY_FIVE_YEARS", category: "Compliance", description: "Review and update all standard operating procedures" },
  { name: "Policy Review and Update", frequency: "EVERY_FIVE_YEARS", category: "Compliance", description: "Review and update all organizational policies" },
];

async function main() {
  console.log("Starting database seed...");

  // Seed document categories and types
  for (const category of documentCategories) {
    console.log(`Creating category: ${category.name}`);

    const createdCategory = await prisma.documentCategory.upsert({
      where: { name: category.name },
      update: {
        description: category.description,
        displayOrder: category.displayOrder,
        icon: category.icon,
        updatedAt: new Date(),
      },
      create: {
        id: randomUUID(),
        name: category.name,
        description: category.description,
        displayOrder: category.displayOrder,
        icon: category.icon,
        updatedAt: new Date(),
      },
    });

    // Create document types for this category
    for (const docType of category.types) {
      console.log(`  - Creating document type: ${docType.name}`);

      await prisma.documentType.upsert({
        where: {
          categoryId_name: {
            categoryId: createdCategory.id,
            name: docType.name,
          },
        },
        update: {
          description: docType.description,
          isRequired: docType.isRequired,
          requiresExpiry: docType.requiresExpiry,
          defaultReviewMonths: docType.defaultReviewMonths,
          ohscMeasureNumber: docType.ohscMeasureNumber,
          updatedAt: new Date(),
        },
        create: {
          id: randomUUID(),
          categoryId: createdCategory.id,
          name: docType.name,
          description: docType.description,
          isRequired: docType.isRequired,
          requiresExpiry: docType.requiresExpiry,
          defaultReviewMonths: docType.defaultReviewMonths,
          ohscMeasureNumber: docType.ohscMeasureNumber,
          updatedAt: new Date(),
        },
      });
    }
  }

  console.log("\nDatabase seed completed!");
  console.log(`Created ${documentCategories.length} categories`);
  console.log(`Created ${documentCategories.reduce((acc, cat) => acc + cat.types.length, 0)} document types`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
