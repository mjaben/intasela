const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const roles = await prisma.role.findMany({
      include: { admins: true }
    });
    console.log(JSON.stringify(roles, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
