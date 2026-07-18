const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixModerators() {
  const updated = await prisma.spaceMember.updateMany({
    where: {
      role: 'MODERATOR',
      status: { not: 'ACTIVE' }
    },
    data: {
      status: 'ACTIVE'
    }
  });
  console.log(`Fixed ${updated.count} moderators stuck in non-active status.`);
}

fixModerators()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
