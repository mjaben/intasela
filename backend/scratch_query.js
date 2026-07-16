const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.advertiserTransaction.findMany();
  console.log("TRANSACTIONS:");
  console.dir(txs, { depth: null });

  const ads = await prisma.advertiser.findMany();
  console.log("ADVERTISERS:");
  console.dir(ads, { depth: null });
}

main().finally(() => prisma.$disconnect());
