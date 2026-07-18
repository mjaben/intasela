import { PrismaClient } from '@prisma/client';

async function test() {
  const prisma = new PrismaClient();
  try {
    const space = await prisma.space.findFirst({ where: { type: 'PRIVATE' } });
    if (!space) return console.log('No private space');

    const targetUser = await prisma.user.findFirst();
    if (!targetUser) return console.log('No target user');

    const res = await fetch(`http://localhost:3001/spaces/${space.id}/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': 'admin'
      },
      body: JSON.stringify({ username: targetUser.username })
    });
    
    console.log('Status:', res.status);
    console.log('Body:', await res.json());
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
test();
