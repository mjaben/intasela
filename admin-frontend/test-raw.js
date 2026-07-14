const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const rates = { sela: 50, resela: 20, reply: 10, viewRpm: 1500 };
    const jsonStr = JSON.stringify(rates);
    
    await prisma.$executeRaw`
      INSERT INTO SystemSetting (\`key\`, \`value\`, \`updatedAt\`) 
      VALUES ('monetization_rates', ${jsonStr}, NOW(3))
      ON DUPLICATE KEY UPDATE \`value\` = ${jsonStr}, \`updatedAt\` = NOW(3)
    `;

    const settings = await prisma.$queryRaw`SELECT \`value\` FROM SystemSetting WHERE \`key\` = 'monetization_rates'`;
    console.log("Settings from DB:", settings);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
