const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const spaces = await prisma.space.findMany({
    include: {
      _count: { select: { members: true } },
      members: { select: { user: { select: { username: true } }, status: true } }
    }
  });
  console.log("Spaces:", JSON.stringify(spaces, null, 2));
}

main().finally(() => prisma.$disconnect());
