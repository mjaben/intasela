const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const members = await prisma.spaceMember.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { space: { select: { name: true } }, user: { select: { username: true } } }
  });
  console.log("Latest space members:", JSON.stringify(members, null, 2));
}

main().finally(() => prisma.$disconnect());
