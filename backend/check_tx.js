const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { id: 'desc' },
    take: 10
  });
  console.log("Recent Transactions:", transactions);

  await prisma.$disconnect();
}
check();
