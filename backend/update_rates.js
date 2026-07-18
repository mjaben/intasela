const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateRates() {
  await prisma.systemSetting.upsert({
    where: { key: 'monetization_rates' },
    update: { value: { sela: 10, reply: 2, resela: 5, viewRpm: 0 } },
    create: { key: 'monetization_rates', value: { sela: 10, reply: 2, resela: 5, viewRpm: 0 } },
  });
  console.log("Updated rates to positive values");
  await prisma.$disconnect();
}
updateRates();
