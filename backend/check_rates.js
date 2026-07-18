const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const rates = await prisma.systemSetting.findUnique({ where: { key: 'monetization_rates' } });
  console.log("Rates:", rates);
  await prisma.$disconnect();
}
check();
