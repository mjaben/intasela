import { PrismaClient } from '@prisma/client';

async function fix() {
  const prisma = new PrismaClient();
  try {
    const res = await prisma.$executeRawUnsafe(`SELECT setval('"Post_id_seq"', (SELECT MAX(id) FROM "Post"));`);
    console.log('Fixed sequence:', res);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
fix();
