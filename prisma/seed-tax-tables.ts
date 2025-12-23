/**
 * SARS 2024/2025 Tax Tables Seed Script
 *
 * This script seeds the database with official SARS tax brackets, rebates,
 * and medical tax credits for the 2024/2025 tax year.
 *
 * Run with: npx tsx prisma/seed-tax-tables.ts
 */

import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

const TAX_YEARS = ["2024/2025", "2025/2026"];

async function main() {
  console.log("🚀 Seeding SARS tax tables for 2024/2025 and 2025/2026...\n");

  // ============================================================================
  // TAX BRACKETS
  // ============================================================================
  console.log("📊 Seeding tax brackets...");

  // Tax brackets are the same for 2024/2025 and 2025/2026 (SARS hasn't changed them)
  const bracketData = [
    {
      minIncome: new Decimal(1),
      maxIncome: new Decimal(237100),
      rate: new Decimal(0.18), // 18%
      baseTax: new Decimal(0),
    },
    {
      minIncome: new Decimal(237101),
      maxIncome: new Decimal(370500),
      rate: new Decimal(0.26), // 26%
      baseTax: new Decimal(42678), // 18% of 237,100
    },
    {
      minIncome: new Decimal(370501),
      maxIncome: new Decimal(512800),
      rate: new Decimal(0.31), // 31%
      baseTax: new Decimal(77362), // 42,678 + 26% of (370,500 - 237,100)
    },
    {
      minIncome: new Decimal(512801),
      maxIncome: new Decimal(673000),
      rate: new Decimal(0.36), // 36%
      baseTax: new Decimal(121475), // 77,362 + 31% of (512,800 - 370,500)
    },
    {
      minIncome: new Decimal(673001),
      maxIncome: new Decimal(857900),
      rate: new Decimal(0.39), // 39%
      baseTax: new Decimal(179147), // 121,475 + 36% of (673,000 - 512,800)
    },
    {
      minIncome: new Decimal(857901),
      maxIncome: new Decimal(1817000),
      rate: new Decimal(0.41), // 41%
      baseTax: new Decimal(251258), // 179,147 + 39% of (857,900 - 673,000)
    },
    {
      minIncome: new Decimal(1817001),
      maxIncome: null, // Unlimited (top bracket)
      rate: new Decimal(0.45), // 45%
      baseTax: new Decimal(644489), // 251,258 + 41% of (1,817,000 - 857,900)
    },
  ];

  let totalBrackets = 0;
  for (const taxYear of TAX_YEARS) {
    for (const bracket of bracketData) {
      await prisma.taxBracket.upsert({
        where: {
          taxYear_minIncome: {
            taxYear,
            minIncome: bracket.minIncome,
          },
        },
        update: { ...bracket, taxYear },
        create: { ...bracket, taxYear },
      });
      totalBrackets++;
    }
  }

  console.log(`✅ Created ${totalBrackets} tax brackets (${bracketData.length} per year)\n`);

  // ============================================================================
  // TAX REBATES (Age-based)
  // ============================================================================
  console.log("🎁 Seeding tax rebates...");

  const rebateData = [
    {
      rebateType: "PRIMARY" as const,
      amount: new Decimal(17235), // Primary rebate for all taxpayers
      ageThreshold: null,
    },
    {
      rebateType: "SECONDARY" as const,
      amount: new Decimal(9444), // Additional rebate for 65+
      ageThreshold: 65,
    },
    {
      rebateType: "TERTIARY" as const,
      amount: new Decimal(3145), // Additional rebate for 75+
      ageThreshold: 75,
    },
  ];

  let totalRebates = 0;
  for (const taxYear of TAX_YEARS) {
    for (const rebate of rebateData) {
      await prisma.taxRebate.upsert({
        where: {
          taxYear_rebateType: {
            taxYear,
            rebateType: rebate.rebateType,
          },
        },
        update: { ...rebate, taxYear },
        create: { ...rebate, taxYear },
      });
      totalRebates++;
    }
  }

  console.log(`✅ Created ${totalRebates} tax rebates (${rebateData.length} per year)`);
  console.log(`   - Primary rebate: R${rebateData[0].amount} (all taxpayers)`);
  console.log(`   - Secondary rebate: R${rebateData[1].amount} (age 65+)`);
  console.log(`   - Tertiary rebate: R${rebateData[2].amount} (age 75+)\n`);

  // ============================================================================
  // MEDICAL TAX CREDITS
  // ============================================================================
  console.log("🏥 Seeding medical tax credits...");

  const medicalCreditData = {
    mainMember: new Decimal(364), // Per month
    firstDependent: new Decimal(364), // Per month
    otherDependents: new Decimal(246), // Per month per additional dependent
  };

  for (const taxYear of TAX_YEARS) {
    await prisma.medicalTaxCredit.upsert({
      where: { taxYear },
      update: { ...medicalCreditData, taxYear },
      create: { ...medicalCreditData, taxYear },
    });
  }

  console.log(`✅ Created medical tax credits for ${TAX_YEARS.length} tax years`);
  console.log(`   - Main member: R${medicalCreditData.mainMember}/month`);
  console.log(`   - First dependent: R${medicalCreditData.firstDependent}/month`);
  console.log(`   - Other dependents: R${medicalCreditData.otherDependents}/month each\n`);

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✨ SARS tax tables seeded successfully!");
  console.log(`   Tax years: ${TAX_YEARS.join(", ")}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("📋 Tax Thresholds:");
  console.log(`   - Below age 65: R${new Decimal(95750).toFixed(0)}/year`);
  console.log(`   - Age 65-74: R${new Decimal(148217).toFixed(0)}/year`);
  console.log(`   - Age 75+: R${new Decimal(165689).toFixed(0)}/year\n`);

  console.log("💡 Next steps:");
  console.log("   1. Restart the development server");
  console.log("   2. Test PAYE calculations\n");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding tax tables:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
