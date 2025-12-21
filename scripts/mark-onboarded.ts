import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Update all existing practices to mark them as onboarded
  const result = await prisma.practice.updateMany({
    data: {
      onboardingCompleted: true,
    },
  });

  console.log(`Updated ${result.count} practices to onboardingCompleted = true`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
