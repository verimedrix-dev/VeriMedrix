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
  // CORE PRINCIPLE 1: IPC
  // =============================================================================
  {
    name: "IPC",
    description: "IPC measures to prevent healthcare-associated infections",
    displayOrder: 1,
    icon: "Shield",
    types: [
      {
        name: "Hand hygiene facilities available",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IPC-1",
        description: "Evidence of hand hygiene facilities (soap, water, sanitiser, signage)",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Hand hygiene audits conducted",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IPC-2",
        description: "Hand hygiene compliance audit records",
        defaultReviewMonths: 3,
        reviewFrequency: "Quarterly"
      },
      {
        name: "Cleaning & disinfection SOP",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IPC-3",
        description: "Standard operating procedure for cleaning and disinfection",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Daily cleaning logs",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IPC-4",
        description: "Daily, weekly and monthly cleaning checklists and logs",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Healthcare risk waste segregation",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IPC-5",
        description: "Waste segregation, handling, storage and disposal procedures",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Waste removal contract",
        isRequired: true,
        requiresExpiry: true,
        ohscMeasureNumber: "IPC-6",
        description: "Service level agreement with licensed waste removal company",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Sharps management system",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IPC-7",
        description: "Safe handling, storage and disposal of sharps",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Sharps injury register",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IPC-8",
        description: "Register of sharps injuries and post-exposure management",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "PPE availability",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IPC-9",
        description: "Evidence of PPE availability and stock records",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "PPE training records",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IPC-10",
        description: "Evidence of staff training on correct PPE usage",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Linen handling process",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IPC-11",
        description: "Clean and dirty linen handling procedures",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Staff IPC training",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IPC-12",
        description: "Evidence of IPC training for all staff members",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
    ],
  },

  // =============================================================================
  // CORE PRINCIPLE 2: EMERGENCY PREPAREDNESS
  // =============================================================================
  {
    name: "Emergency Preparedness",
    description: "Emergency response planning and equipment readiness",
    displayOrder: 2,
    icon: "AlertTriangle",
    types: [
      {
        name: "Emergency trolley/bag available",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "EP-1",
        description: "Evidence of emergency trolley or bag with required equipment",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Emergency trolley checklist",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "EP-2",
        description: "Regular checks of emergency trolley contents and condition",
        reviewFrequency: "Weekly"
      },
      {
        name: "Emergency drugs stocked",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "EP-3",
        description: "Emergency medication inventory available and stocked",
        reviewFrequency: "Weekly"
      },
      {
        name: "Emergency drug expiry checks",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "EP-4",
        description: "Regular expiry date checks on emergency drugs",
        reviewFrequency: "Weekly"
      },
      {
        name: "Oxygen supply available",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "EP-5",
        description: "Evidence of functional oxygen supply and delivery equipment",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Oxygen pressure checks",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "EP-6",
        description: "Regular oxygen cylinder pressure and flow checks",
        reviewFrequency: "Weekly"
      },
      {
        name: "Suction equipment functional",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "EP-7",
        description: "Evidence of functional suction equipment and regular testing",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Airway equipment available",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "EP-8",
        description: "Airway management equipment available and functional",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "BLS/CPR trained staff",
        isRequired: true,
        requiresExpiry: true,
        ohscMeasureNumber: "EP-9",
        description: "Current BLS/CPR certification for clinical staff",
        defaultReviewMonths: 24,
        reviewFrequency: "2-Yearly"
      },
      {
        name: "Emergency referral pathways",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "EP-10",
        description: "Documented emergency referral pathways and contact numbers",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Emergency drills conducted",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "EP-11",
        description: "Evidence of regular emergency drills and documentation",
        defaultReviewMonths: 6,
        reviewFrequency: "Bi-annually"
      },
      {
        name: "Clinical risk register",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "EP-12",
        description: "Register of clinical risks, mitigations and review dates",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
    ],
  },

  // =============================================================================
  // CORE PRINCIPLE 3: CLINICAL GOVERNANCE
  // =============================================================================
  {
    name: "Clinical Governance",
    description: "Clinical quality assurance and governance framework",
    displayOrder: 3,
    icon: "Stethoscope",
    types: [
      {
        name: "Clinical governance framework",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "CG-1",
        description: "Documented clinical governance structure and responsibilities",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Incident reporting system",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "CG-2",
        description: "System for reporting clinical incidents",
        reviewFrequency: "Continuous"
      },
      {
        name: "Incident investigations",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "CG-3",
        description: "Investigation records for reported incidents",
        reviewFrequency: "Continuous"
      },
      {
        name: "Near-miss reporting",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "CG-4",
        description: "Near-miss event reporting and documentation",
        reviewFrequency: "Continuous"
      },
      {
        name: "Adverse event management",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "CG-5",
        description: "Management and documentation of adverse events",
        reviewFrequency: "Continuous"
      },
      {
        name: "Informed consent SOP",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "CG-6",
        description: "Standard operating procedure for informed consent",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Signed consent forms",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "CG-7",
        description: "Completed and signed patient consent forms",
        reviewFrequency: "Continuous"
      },
      {
        name: "Scope of practice compliance",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "CG-8",
        description: "Evidence of compliance with scope of practice requirements",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Clinical audits",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "CG-9",
        description: "Regular clinical audit reports and findings",
        defaultReviewMonths: 3,
        reviewFrequency: "Quarterly"
      },
      {
        name: "Quality improvement plans",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "CG-10",
        description: "Documented quality improvement initiatives and outcomes",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Complaints review",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "CG-11",
        description: "Patient complaints review and resolution records",
        reviewFrequency: "Continuous"
      },
      {
        name: "Morbidity & mortality review",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "CG-12",
        description: "Morbidity and mortality review meetings and documentation",
        defaultReviewMonths: 3,
        reviewFrequency: "Quarterly"
      },
    ],
  },

  // =============================================================================
  // CORE PRINCIPLE 4: INFRASTRUCTURE & ENVIRONMENT
  // =============================================================================
  {
    name: "Infrastructure & Environment",
    description: "Facility management and environmental safety",
    displayOrder: 4,
    icon: "Building2",
    types: [
      {
        name: "Consulting room safety checks",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IE-1",
        description: "Safety inspection records for consulting rooms",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Waiting area safety",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IE-2",
        description: "Safety assessment of patient waiting areas",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Preventive maintenance plan",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IE-3",
        description: "Scheduled preventive maintenance plan for facility and equipment",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Maintenance records",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IE-4",
        description: "Records of completed maintenance activities",
        reviewFrequency: "Continuous"
      },
      {
        name: "Electrical safety compliance",
        isRequired: true,
        requiresExpiry: true,
        ohscMeasureNumber: "IE-5",
        description: "Electrical Certificate of Compliance and safety records",
        defaultReviewMonths: 24,
        reviewFrequency: "2-Yearly"
      },
      {
        name: "Fire safety equipment",
        isRequired: true,
        requiresExpiry: true,
        ohscMeasureNumber: "IE-6",
        description: "Fire extinguishers, alarms, and fire safety equipment records",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Fire exit signage",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IE-7",
        description: "Evidence of compliant fire exit signage throughout facility",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Ventilation adequacy",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IE-8",
        description: "Assessment and records of adequate ventilation in the facility",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Lighting adequacy",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IE-9",
        description: "Assessment of adequate lighting throughout the facility",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Patient privacy measures",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IE-10",
        description: "Evidence of physical privacy measures for patients",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Accessibility for disabled",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IE-11",
        description: "Evidence of accessibility provisions for disabled persons",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Equipment servicing logs",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "IE-12",
        description: "Service and calibration logs for medical equipment",
        reviewFrequency: "Continuous"
      },
    ],
  },

  // =============================================================================
  // CORE PRINCIPLE 5: MEDICINES & VACCINES
  // =============================================================================
  {
    name: "Medicines & Vaccines",
    description: "Pharmaceutical management and vaccine cold chain",
    displayOrder: 5,
    icon: "Pill",
    types: [
      {
        name: "Secure medicine storage",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "MV-1",
        description: "Evidence of secure storage for medicines",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Controlled drug storage",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "MV-2",
        description: "Secure storage for controlled substances (Schedule 5/6)",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Schedule 5/6 register",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "MV-3",
        description: "Register for Schedule 5 and 6 controlled substances",
        reviewFrequency: "Continuous"
      },
      {
        name: "Cold chain fridge",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "MV-4",
        description: "Dedicated cold chain fridge for vaccine storage (2-8°C)",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Daily fridge temperature logs",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "MV-5",
        description: "Daily temperature monitoring records for cold chain fridge",
        reviewFrequency: "Daily"
      },
      {
        name: "Vaccine stock list",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "MV-6",
        description: "Current list of vaccine stock held",
        defaultReviewMonths: 1,
        reviewFrequency: "Monthly"
      },
      {
        name: "Expiry date monitoring",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "MV-7",
        description: "System for monitoring medicine and vaccine expiry dates",
        defaultReviewMonths: 1,
        reviewFrequency: "Monthly"
      },
      {
        name: "Emergency drug stock",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "MV-8",
        description: "Emergency drug stock availability and checks",
        defaultReviewMonths: 1,
        reviewFrequency: "Monthly"
      },
      {
        name: "Stock rotation (FIFO)",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "MV-9",
        description: "First-in-first-out stock rotation system for medicines",
        reviewFrequency: "Continuous"
      },
      {
        name: "Medicine recall process",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "MV-10",
        description: "Process for handling medicine recalls",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Expired stock disposal",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "MV-11",
        description: "Records of expired medicine disposal",
        reviewFrequency: "Continuous"
      },
      {
        name: "Supplier records",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "MV-12",
        description: "Records of pharmaceutical suppliers and agreements",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
    ],
  },

  // =============================================================================
  // CORE PRINCIPLE 6: HUMAN RESOURCES
  // =============================================================================
  {
    name: "Human Resources",
    description: "Staff management, credentials and training",
    displayOrder: 6,
    icon: "Users",
    types: [
      {
        name: "Staff contracts on file",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HR-1",
        description: "Signed employment contracts for all staff",
        reviewFrequency: "Continuous"
      },
      {
        name: "Job descriptions available",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HR-2",
        description: "Written job descriptions for all positions",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Professional registration verified",
        isRequired: true,
        requiresExpiry: true,
        ohscMeasureNumber: "HR-3",
        description: "Verification of professional registration (HPCSA/SANC/SAPC)",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Registration renewal tracking",
        isRequired: true,
        requiresExpiry: true,
        ohscMeasureNumber: "HR-4",
        description: "System for tracking professional registration renewals",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Staff induction records",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HR-5",
        description: "Induction and orientation records for new staff",
        reviewFrequency: "Continuous"
      },
      {
        name: "Scope of practice alignment",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HR-6",
        description: "Evidence that staff duties align with scope of practice",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "CPD compliance",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HR-7",
        description: "Continuing professional development compliance records",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Mandatory training (BLS)",
        isRequired: true,
        requiresExpiry: true,
        ohscMeasureNumber: "HR-8",
        description: "Evidence of mandatory training including Basic Life Support",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Staff immunisation records",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HR-9",
        description: "Vaccination records for all staff (Hep B, Flu, etc.)",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Performance appraisals",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HR-10",
        description: "Annual performance reviews for all staff",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Supervision records",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HR-11",
        description: "Records of clinical supervision sessions",
        defaultReviewMonths: 3,
        reviewFrequency: "Quarterly"
      },
      {
        name: "Disciplinary process",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HR-12",
        description: "Documented disciplinary procedures and records",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
    ],
  },

  // =============================================================================
  // CORE PRINCIPLE 7: PATIENT RIGHTS
  // =============================================================================
  {
    name: "Patient Rights",
    description: "Patient rights, dignity and complaint management",
    displayOrder: 7,
    icon: "Heart",
    types: [
      {
        name: "Patient Rights Charter displayed",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "PR-1",
        description: "Patients' Rights Charter visibly displayed in the facility",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Privacy during consultation",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "PR-2",
        description: "Evidence of patient privacy measures during consultations",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Confidentiality policy",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "PR-3",
        description: "Policy for patient confidentiality and data protection",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Informed consent communication",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "PR-4",
        description: "Evidence of informed consent communication with patients",
        reviewFrequency: "Continuous"
      },
      {
        name: "Respectful communication training",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "PR-5",
        description: "Staff training on respectful and dignified communication",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Complaints register",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "PR-6",
        description: "Register of all patient complaints received",
        reviewFrequency: "Continuous"
      },
      {
        name: "Complaint resolution records",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "PR-7",
        description: "Records of complaint investigation and resolution",
        reviewFrequency: "Continuous"
      },
      {
        name: "Patient feedback system",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "PR-8",
        description: "System for collecting patient feedback (suggestion boxes, surveys)",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Feedback analysis",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "PR-9",
        description: "Analysis of patient feedback and actions taken",
        defaultReviewMonths: 3,
        reviewFrequency: "Quarterly"
      },
      {
        name: "Waiting time communication",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "PR-10",
        description: "Communication of expected waiting times to patients",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Cultural sensitivity training",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "PR-11",
        description: "Staff training on cultural sensitivity and diversity",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Support for vulnerable patients",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "PR-12",
        description: "Protocols and support measures for vulnerable patient groups",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
    ],
  },

  // =============================================================================
  // CORE PRINCIPLE 8: HEALTH INFORMATION
  // =============================================================================
  {
    name: "Health Information",
    description: "Patient records, data management and information security",
    displayOrder: 8,
    icon: "Database",
    types: [
      {
        name: "Complete clinical records",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HI-1",
        description: "Evidence of complete and accurate clinical records",
        reviewFrequency: "Continuous"
      },
      {
        name: "Legible documentation",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HI-2",
        description: "Evidence of legible clinical documentation standards",
        reviewFrequency: "Continuous"
      },
      {
        name: "ICD-10 accuracy audits",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HI-3",
        description: "Audits of ICD-10 coding accuracy",
        defaultReviewMonths: 3,
        reviewFrequency: "Quarterly"
      },
      {
        name: "Electronic system security",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HI-4",
        description: "Security measures for electronic health information systems",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "User access controls",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HI-5",
        description: "User access control policies and registers",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Password management",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HI-6",
        description: "Password management policy and practices",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "POPIA policy",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HI-7",
        description: "Protection of Personal Information Act compliance policy",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "POPIA staff training",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HI-8",
        description: "Staff training records on POPIA compliance",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Record retention policy",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HI-9",
        description: "Policy for retention and destruction of records",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
      },
      {
        name: "Secure paper file storage",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HI-10",
        description: "Evidence of secure storage for paper-based files",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Data backup system",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HI-11",
        description: "System for regular data backups and recovery",
        defaultReviewMonths: 12,
        reviewFrequency: "Annually"
      },
      {
        name: "Data breach response plan",
        isRequired: true,
        requiresExpiry: false,
        ohscMeasureNumber: "HI-12",
        description: "Plan for responding to data breaches and security incidents",
        defaultReviewMonths: 60,
        reviewFrequency: "5-Yearly"
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
