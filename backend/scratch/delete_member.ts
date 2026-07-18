import { PrismaClient } from '@prisma/client';

async function test() {
  const prisma = new PrismaClient();
  try {
    const targetUser = await prisma.user.findFirst();
    if (!targetUser) return console.log('No user');
    
    await prisma.spaceMember.deleteMany({
      where: { userId: targetUser.id }
    });
    console.log('Deleted memberships');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
test();
