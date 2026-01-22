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
  reviewFrequency?: string; // For display purposes
}

interface DocumentCategoryDefinition {
  name: string;
  description: string;
  displayOrder: number;
  icon: string;
  types: DocumentTypeDefinition[];
}

// Helper to convert review frequency to months
function frequencyToMonths(frequency: string): number | undefined {
  switch (frequency) {
    case "Daily": return undefined; // Too frequent for document review
    case "Weekly": return undefined;
    case "Monthly": return 1;
    case "Quarterly": return 3;
    case "Bi-annually": return 6;
    case "Annually": return 12;
    case "2-Yearly": return 24;
    case "5-Yearly": return 60;
    case "Continuous": return undefined;
    case "Ongoing": return undefined;
    default: return undefined;
  }
}

/**
 * OHSC 96-Item Inspection Checklist
 * Based on the official OHSC Master Tracker
 *
 * 8 Core Principles, 12 Items Each = 96 Total
 */
const documentCategories: DocumentCategoryDefinition[] = [
  // =============================================================================
  // CORE PRINCIPLE 1: INFECTION PREVENTION & CONTROL (IPC)
  // =============================================================================
  {
    name: "1. Infection Prevention & Control",
    description: "IPC measures to prevent healthcare-associated infections",
    displayOrder: 1,
    icon: "Shield",
    types: [
      {
        name: "IPC Policy Document",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IPC-1",
        description: "Written infection prevention and control policy",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Hand Hygiene Protocol",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IPC-2",
        description: "Hand hygiene facilities and compliance documentation",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "PPE Protocol & Stock Records",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IPC-3",
        description: "Personal Protective Equipment availability and usage protocols",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Sterilisation & Decontamination SOP",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IPC-4",
        description: "Standard operating procedures for sterilisation and decontamination",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Healthcare Waste Management Plan",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IPC-5",
        description: "Waste segregation, handling, storage and disposal procedures",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Waste Service Provider Contract",
        isRequired: true,
        requiresExpiry: true,
        ohscMeasureNumber: "IPC-6",
        description: "Service level agreement with licensed waste management company",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Sharps Safety Protocol",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IPC-7",
        description: "Safe handling and disposal of sharps",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Environmental Cleaning Schedule",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IPC-8",
        description: "Daily, weekly, monthly cleaning schedules and checklists",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Linen Management Protocol",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IPC-9",
        description: "Clean and dirty linen handling procedures",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Outbreak Response Plan",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IPC-10",
        description: "Procedures for managing infectious disease outbreaks",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Staff IPC Training Records",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IPC-11",
        description: "Evidence of IPC training for all staff members",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "IPC Audit Records",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IPC-12",
        description: "Regular IPC compliance audits and corrective actions",
        defaultReviewMonths: 3,
        reviewFrequency: "Quarterly"
      },
    ],
  },

  // =============================================================================
  // CORE PRINCIPLE 2: EMERGENCY PREPAREDNESS
  // =============================================================================
  {
    name: "2. Emergency Preparedness",
    description: "Emergency response planning and equipment readiness",
    displayOrder: 2,
    icon: "AlertTriangle",
    types: [
      {
        name: "Emergency Response Plan",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "EP-1",
        description: "Comprehensive emergency and disaster response plan",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Fire Safety Plan",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "EP-2",
        description: "Fire prevention, detection and evacuation procedures",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Fire Safety Compliance Certificate",
        isRequired: true,
        requiresExpiry: true,
        ohscMeasureNumber: "EP-3",
        description: "Certificate of compliance from fire department",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Fire Equipment Service Records",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "EP-4",
        description: "Maintenance records for extinguishers, alarms, sprinklers",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Fire Drill Records",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "EP-5",
        description: "Evidence of regular fire evacuation drills",
        defaultReviewMonths: 6,
        reviewFrequency: "Bi-annually"
      },
      {
        name: "Emergency Trolley/Equipment Checklist",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "EP-6",
        description: "Weekly checks of emergency equipment and supplies",
        reviewFrequency: "Weekly"
      },
      {
        name: "Resuscitation Equipment Inventory",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "EP-7",
        description: "List and condition of resuscitation equipment",
        reviewFrequency: "Weekly"
      },
      {
        name: "Emergency Drug Stock List",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "EP-8",
        description: "Emergency medication inventory and expiry tracking",
        reviewFrequency: "Weekly"
      },
      {
        name: "BLS/ACLS Staff Certification Records",
        isRequired: true,
        requiresExpiry: true,
        ohscMeasureNumber: "EP-9",
        description: "Current BLS/ACLS certification for clinical staff",
        defaultReviewMonths: 24,
        reviewFrequency: "2-Yearly"
      },
      {
        name: "Emergency Contact Directory",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "EP-10",
        description: "Emergency contact numbers for services and authorities",
        defaultReviewMonths: 6,
        reviewFrequency: "Bi-annually"
      },
      {
        name: "Business Continuity Plan",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "EP-11",
        description: "Plan for maintaining operations during emergencies",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Emergency Signage Documentation",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "EP-12",
        description: "Exit signs, evacuation routes, assembly point signage",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
    ],
  },

  // =============================================================================
  // CORE PRINCIPLE 3: CLINICAL GOVERNANCE
  // =============================================================================
  {
    name: "3. Clinical Governance",
    description: "Clinical quality assurance and governance framework",
    displayOrder: 3,
    icon: "Stethoscope",
    types: [
      {
        name: "Clinical Governance Framework",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "CG-1",
        description: "Documented clinical governance structure and responsibilities",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Clinical Protocols & Guidelines",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "CG-2",
        description: "Standard treatment protocols and clinical guidelines",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Referral Policy & Directory",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "CG-3",
        description: "Patient referral protocols and specialist directory",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Adverse Events Register",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "CG-4",
        description: "Register of adverse events and corrective actions",
        reviewFrequency: "Continuous"
      },
      {
        name: "Clinical Audit Reports",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "CG-5",
        description: "Regular clinical audits including file audits",
        defaultReviewMonths: 3,
        reviewFrequency: "Quarterly"
      },
      {
        name: "Prescribing Audit Records",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "CG-6",
        description: "Audits of prescribing practices and antibiotic stewardship",
        defaultReviewMonths: 3,
        reviewFrequency: "Quarterly"
      },
      {
        name: "Quality Improvement Plan",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "CG-7",
        description: "Documented quality improvement initiatives and outcomes",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Morbidity & Mortality Review Records",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "CG-8",
        description: "M&M meetings and review documentation",
        defaultReviewMonths: 3,
        reviewFrequency: "Quarterly"
      },
      {
        name: "Clinical Meeting Minutes",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "CG-9",
        description: "Records of clinical governance meetings",
        defaultReviewMonths: 1,
        reviewFrequency: "Monthly"
      },
      {
        name: "Patient Safety Incident Reports",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "CG-10",
        description: "Incident reporting and investigation records",
        reviewFrequency: "Continuous"
      },
      {
        name: "Informed Consent SOP & Forms",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "CG-11",
        description: "Consent policy and standardised consent forms",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Triage Protocol",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "CG-12",
        description: "Patient triage and prioritisation procedures",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
    ],
  },

  // =============================================================================
  // CORE PRINCIPLE 4: INFRASTRUCTURE & ENVIRONMENT
  // =============================================================================
  {
    name: "4. Infrastructure & Environment",
    description: "Facility management and environmental safety",
    displayOrder: 4,
    icon: "Building2",
    types: [
      {
        name: "Facility License Certificate",
        isRequired: true,
        requiresExpiry: true,
        ohscMeasureNumber: "IE-1",
        description: "Current health facility license from Department of Health",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Building Compliance Certificate",
        isRequired: true,
        requiresExpiry: true,
        ohscMeasureNumber: "IE-2",
        description: "Certificate of occupancy and building compliance",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Electrical Compliance Certificate",
        isRequired: true,
        requiresExpiry: true,
        ohscMeasureNumber: "IE-3",
        description: "Electrical Certificate of Compliance (COC)",
        defaultReviewMonths: 24,
        reviewFrequency: "2-Yearly"
      },
      {
        name: "Water Safety Plan",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IE-4",
        description: "Water quality testing and legionella prevention",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Equipment Maintenance Schedule",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IE-5",
        description: "Preventive maintenance schedules for all equipment",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Equipment Calibration Records",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IE-6",
        description: "Calibration certificates for medical equipment",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Equipment Inventory Register",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IE-7",
        description: "Complete inventory of all medical equipment",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Pest Control Contract & Records",
        isRequired: true,
        requiresExpiry: true,
        ohscMeasureNumber: "IE-8",
        description: "Pest control service agreement and treatment records",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Ventilation & HVAC Maintenance",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IE-9",
        description: "Air conditioning and ventilation maintenance records",
        defaultReviewMonths: 6,
        reviewFrequency: "Bi-annually"
      },
      {
        name: "Security Plan & Access Control",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IE-10",
        description: "Security measures and access control documentation",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Generator/UPS Maintenance Records",
        isRequired: false,
        requiresExpiry: false,
        ohscMeasureNumber: "IE-11",
        description: "Backup power maintenance and testing records (if applicable)",
        defaultReviewMonths: 6,
        reviewFrequency: "Bi-annually"
      },
      {
        name: "Facility Risk Assessment",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IE-12",
        description: "Environmental and infrastructure risk assessment",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
    ],
  },

  // =============================================================================
  // CORE PRINCIPLE 5: MEDICINES & VACCINES
  // =============================================================================
  {
    name: "5. Medicines & Vaccines",
    description: "Pharmaceutical management and vaccine cold chain",
    displayOrder: 5,
    icon: "Pill",
    types: [
      {
        name: "Dispensing License",
        isRequired: false,
        requiresExpiry: true,
        ohscMeasureNumber: "MV-1",
        description: "License to dispense medication (if applicable)",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Medicine Management Policy",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "MV-2",
        description: "Policy for medicine procurement, storage and dispensing",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Controlled Substances Register",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "MV-3",
        description: "Schedule 5+ controlled substances register",
        reviewFrequency: "Daily"
      },
      {
        name: "Medicine Stock Inventory",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "MV-4",
        description: "Current stock list with expiry dates",
        defaultReviewMonths: 1,
        reviewFrequency: "Monthly"
      },
      {
        name: "Cold Chain Temperature Logs",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "MV-5",
        description: "Fridge temperature monitoring records (2-8°C)",
        reviewFrequency: "Daily"
      },
      {
        name: "Vaccine Management Protocol",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "MV-6",
        description: "Vaccine storage, handling and administration procedures",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Cold Chain Breach Protocol",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "MV-7",
        description: "Procedure for cold chain failure incidents",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Expired Medicine Disposal Records",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "MV-8",
        description: "Documentation of expired medicine disposal",
        defaultReviewMonths: 1,
        reviewFrequency: "Monthly"
      },
      {
        name: "Adverse Drug Reaction Protocol",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "MV-9",
        description: "SOP for managing and reporting adverse drug reactions",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Drug Allergy Documentation SOP",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "MV-10",
        description: "Procedure for documenting and checking drug allergies",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Medicine Storage Security",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "MV-11",
        description: "Security measures for medicine storage areas",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Supplier Agreements & GMP Certificates",
        isRequired: true,
        requiresExpiry: true,
        ohscMeasureNumber: "MV-12",
        description: "Pharmaceutical supplier contracts and compliance certificates",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
    ],
  },

  // =============================================================================
  // CORE PRINCIPLE 6: HUMAN RESOURCES
  // =============================================================================
  {
    name: "6. Human Resources",
    description: "Staff management, credentials and training",
    displayOrder: 6,
    icon: "Users",
    types: [
      {
        name: "Staff HR Files",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HR-1",
        description: "Complete personnel files for all staff members",
        reviewFrequency: "Continuous"
      },
      {
        name: "HPCSA Registration Certificates",
        isRequired: true,
        requiresExpiry: true,
        ohscMeasureNumber: "HR-2",
        description: "Current HPCSA registration for all healthcare professionals",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "SANC Registration Certificates",
        isRequired: true,
        requiresExpiry: true,
        ohscMeasureNumber: "HR-3",
        description: "Current SANC registration for nursing staff",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "SAPC Registration Certificates",
        isRequired: false,
        requiresExpiry: true,
        ohscMeasureNumber: "HR-4",
        description: "SAPC registration for pharmacy staff (if applicable)",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Job Descriptions",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HR-5",
        description: "Written job descriptions for all positions",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Employment Contracts",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HR-6",
        description: "Signed employment contracts for all staff",
        reviewFrequency: "Continuous"
      },
      {
        name: "Staff Training Records",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HR-7",
        description: "Evidence of mandatory training completion",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Orientation & Induction Records",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HR-8",
        description: "New staff orientation and induction documentation",
        reviewFrequency: "Continuous"
      },
      {
        name: "CPD/CME Records",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HR-9",
        description: "Continuing professional development records",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Staff Immunisation Records",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HR-10",
        description: "Vaccination records for all staff (Hep B, Flu, etc.)",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Performance Appraisal Records",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HR-11",
        description: "Annual performance reviews for all staff",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Professional Indemnity Insurance",
        isRequired: true,
        requiresExpiry: true,
        ohscMeasureNumber: "HR-12",
        description: "Current professional indemnity cover for practitioners",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
    ],
  },

  // =============================================================================
  // CORE PRINCIPLE 7: PATIENT RIGHTS
  // =============================================================================
  {
    name: "7. Patient Rights",
    description: "Patient rights, dignity and complaint management",
    displayOrder: 7,
    icon: "Heart",
    types: [
      {
        name: "Patient Rights Charter",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "PR-1",
        description: "Displayed Patients' Rights Charter (all official languages)",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Complaints Management Policy",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "PR-2",
        description: "Policy for handling and resolving patient complaints",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Complaints Register",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "PR-3",
        description: "Register of all complaints with resolution tracking",
        reviewFrequency: "Continuous"
      },
      {
        name: "Complaints Analysis Reports",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "PR-4",
        description: "Quarterly analysis of complaints and trends",
        defaultReviewMonths: 3,
        reviewFrequency: "Quarterly"
      },
      {
        name: "Patient Satisfaction Survey Results",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "PR-5",
        description: "Patient satisfaction surveys and analysis",
        defaultReviewMonths: 3,
        reviewFrequency: "Quarterly"
      },
      {
        name: "Patient Privacy Policy (POPIA)",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "PR-6",
        description: "Privacy and data protection policy compliant with POPIA",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Consent Forms Templates",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "PR-7",
        description: "Standardised informed consent forms",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Patient Communication Policy",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "PR-8",
        description: "Guidelines for patient communication and education",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Vulnerable Patients Protocol",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "PR-9",
        description: "Special procedures for vulnerable patient groups",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Interpreter Services Information",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "PR-10",
        description: "Access to interpreter services for language barriers",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Waiting Time Management",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "PR-11",
        description: "Policy and monitoring of patient waiting times",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Patient Feedback Mechanism",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "PR-12",
        description: "Suggestion boxes, feedback forms, complaint channels",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
    ],
  },

  // =============================================================================
  // CORE PRINCIPLE 8: HEALTH INFORMATION MANAGEMENT
  // =============================================================================
  {
    name: "8. Health Information Management",
    description: "Patient records, data management and reporting",
    displayOrder: 8,
    icon: "Database",
    types: [
      {
        name: "Health Records Policy",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HI-1",
        description: "Policy for creation, maintenance and storage of health records",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Record Retention Schedule",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HI-2",
        description: "Document retention periods and destruction procedures",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Electronic Health Record SOP",
        isRequired: false,
        requiresExpiry: false,
        ohscMeasureNumber: "HI-3",
        description: "Standard operating procedures for EHR system (if applicable)",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Data Backup & Recovery Plan",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HI-4",
        description: "Procedures for backing up and recovering patient data",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Information Security Policy",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HI-5",
        description: "IT security measures and access controls",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Access Control Register",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HI-6",
        description: "Log of who has access to patient records",
        defaultReviewMonths: 6,
        reviewFrequency: "Bi-annually"
      },
      {
        name: "Record Audit Trail",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HI-7",
        description: "Audit logs of record access and modifications",
        defaultReviewMonths: 3,
        reviewFrequency: "Quarterly"
      },
      {
        name: "Statistics & Reporting Protocols",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HI-8",
        description: "Procedures for compiling and submitting health statistics",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Notifiable Diseases Reporting SOP",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HI-9",
        description: "Procedures for reporting notifiable medical conditions",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Health Information Exchange Agreements",
        isRequired: false,
        requiresExpiry: true,
        ohscMeasureNumber: "HI-10",
        description: "Agreements with other facilities for information sharing",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Record Destruction Log",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HI-11",
        description: "Log of destroyed records with authorisation",
        reviewFrequency: "Continuous"
      },
      {
        name: "OHSC Self-Assessment Report",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HI-12",
        description: "Completed OHSC self-assessment checklist",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
    ],
  },
];

async function main() {
  console.log("Starting OHSC 96-Item Document Categories seed...");
  console.log("=".repeat(60));

  // First, let's check for existing documents
  const existingDocuments = await prisma.document.count();

  if (existingDocuments > 0) {
    console.log(`\n⚠️  Found ${existingDocuments} existing documents.`);
    console.log("   Updating categories without removing existing document type associations.\n");
  }

  let totalCategories = 0;
  let totalTypes = 0;

  // Seed document categories and types
  for (const category of documentCategories) {
    console.log(`\n📁 Creating/Updating: ${category.name}`);

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

    totalCategories++;

    // Create document types for this category
    for (const docType of category.types) {
      const existingType = await prisma.documentType.findFirst({
        where: {
          categoryId: createdCategory.id,
          name: docType.name,
        },
      });

      if (existingType) {
        await prisma.documentType.update({
          where: { id: existingType.id },
          data: {
            description: docType.description,
            isRequired: docType.isRequired,
            requiresExpiry: docType.requiresExpiry,
            defaultReviewMonths: docType.defaultReviewMonths,
            ohscMeasureNumber: docType.ohscMeasureNumber,
            guidanceNotes: docType.reviewFrequency ? `Review frequency: ${docType.reviewFrequency}` : null,
            updatedAt: new Date(),
          },
        });
        console.log(`   ✓ Updated: ${docType.name} (${docType.ohscMeasureNumber})`);
      } else {
        await prisma.documentType.create({
          data: {
            id: randomUUID(),
            categoryId: createdCategory.id,
            name: docType.name,
            description: docType.description,
            isRequired: docType.isRequired,
            requiresExpiry: docType.requiresExpiry,
            defaultReviewMonths: docType.defaultReviewMonths,
            ohscMeasureNumber: docType.ohscMeasureNumber,
            guidanceNotes: docType.reviewFrequency ? `Review frequency: ${docType.reviewFrequency}` : null,
            updatedAt: new Date(),
          },
        });
        console.log(`   + Created: ${docType.name} (${docType.ohscMeasureNumber})`);
      }
      totalTypes++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ OHSC Document Categories seed completed!");
  console.log(`   📁 ${totalCategories} categories (8 Core Principles)`);
  console.log(`   📄 ${totalTypes} document types (96 items)`);
  console.log("=".repeat(60));
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
