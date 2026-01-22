-- CustomForm and CustomFormResponse tables for Custom Forms feature
-- Run this in Supabase SQL Editor

-- Create CustomFormSchedule enum
DO $$ BEGIN
    CREATE TYPE "CustomFormSchedule" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create CustomForm table
CREATE TABLE IF NOT EXISTS "CustomForm" (
    "id" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fields" JSONB NOT NULL,
    "schedule" "CustomFormSchedule",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomForm_pkey" PRIMARY KEY ("id")
);

-- Create CustomFormResponse table
CREATE TABLE IF NOT EXISTS "CustomFormResponse" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "responses" JSONB NOT NULL,
    "submittedById" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "CustomFormResponse_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "CustomForm_practiceId_idx" ON "CustomForm"("practiceId");
CREATE INDEX IF NOT EXISTS "CustomForm_isActive_idx" ON "CustomForm"("isActive");
CREATE INDEX IF NOT EXISTS "CustomFormResponse_formId_idx" ON "CustomFormResponse"("formId");
CREATE INDEX IF NOT EXISTS "CustomFormResponse_practiceId_idx" ON "CustomFormResponse"("practiceId");
CREATE INDEX IF NOT EXISTS "CustomFormResponse_submittedAt_idx" ON "CustomFormResponse"("submittedAt");

-- Add foreign keys
ALTER TABLE "CustomForm" ADD CONSTRAINT "CustomForm_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomForm" ADD CONSTRAINT "CustomForm_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomFormResponse" ADD CONSTRAINT "CustomFormResponse_formId_fkey" FOREIGN KEY ("formId") REFERENCES "CustomForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomFormResponse" ADD CONSTRAINT "CustomFormResponse_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomFormResponse" ADD CONSTRAINT "CustomFormResponse_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
