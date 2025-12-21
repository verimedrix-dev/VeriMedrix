import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function makeSuperAdmin() {
  // Find the first user or a specific user by email
  const email = process.argv[2];

  if (!email) {
    // If no email provided, list all users and their roles
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true },
      take: 10,
    });

    console.log("Current users:");
    users.forEach((u) => {
      console.log(`  ${u.email} - ${u.role}`);
    });

    console.log("\nUsage: npx tsx scripts/make-super-admin.ts <email>");
    process.exit(0);
  }

  // Update the user to SUPER_ADMIN
  const user = await prisma.user.update({
    where: { email },
    data: { role: "SUPER_ADMIN" },
  });

  console.log(`Updated ${user.email} to SUPER_ADMIN role`);
}

makeSuperAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
