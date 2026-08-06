const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Find a simulated user
    const user = await prisma.user.findFirst({
      where: { email: { endsWith: '@intasela.internal' } }
    });

    if (!user) {
      console.log('No user found');
      return;
    }

    console.log('Attempting to delete user:', user.id);
    
    await prisma.user.deleteMany({
      where: { id: user.id }
    });

    console.log('Successfully deleted user');
  } catch (error) {
    console.error('Failed to delete user:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
