import { PrismaClient } from '@prisma/client';

async function test() {
  const prisma = new PrismaClient();
  try {
    const space = await prisma.space.findFirst({ where: { type: 'PRIVATE' } });
    if (!space) return console.log('No private space');

    const targetUser = await prisma.user.findFirst();
    if (!targetUser) return console.log('No user');

    const member = await prisma.spaceMember.findUnique({
      where: { spaceId_userId: { spaceId: space.id, userId: targetUser.id } }
    });
    
    console.log('Member:', member);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
test();
