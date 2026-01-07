import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find all practice owners that are inactive
  const inactiveOwners = await prisma.user.findMany({
    where: {
      role: 'PRACTICE_OWNER',
      isActive: false
    },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true
    }
  });

  console.log('Inactive owners found:', inactiveOwners);

  // Fix them
  if (inactiveOwners.length > 0) {
    const result = await prisma.user.updateMany({
      where: {
        role: 'PRACTICE_OWNER',
        isActive: false
      },
      data: {
        isActive: true
      }
    });
    console.log('Fixed', result.count, 'owner(s)');
  } else {
    console.log('No inactive owners to fix');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
