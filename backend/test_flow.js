const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const settings = await prisma.systemSetting.findUnique({ where: { key: 'monetization_rates' } });
  console.log("Rates:", settings);
  const rulesSetting = await prisma.systemSetting.findUnique({ where: { key: 'monetization_rules' } });
  console.log("Rules:", rulesSetting);
  
  // Find a recent post
  const post = await prisma.post.findFirst({
    orderBy: { id: 'desc' },
    take: 1
  });
  console.log("Most recent post:", post);

  await prisma.$disconnect();
}
check();
