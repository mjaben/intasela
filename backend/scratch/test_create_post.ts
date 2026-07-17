import { PrismaClient } from '@prisma/client';

async function test() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst();
  if (!user) return console.log('No user');

  try {
    const post = await prisma.post.create({
      data: {
        content: 'Test post',
        authorId: user.id
      }
    });
    console.log('Created:', post.id);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
test();
