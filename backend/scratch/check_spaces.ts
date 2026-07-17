import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.space.findMany().then(s => {
  console.log(JSON.stringify(s, null, 2));
  prisma.$disconnect();
});
