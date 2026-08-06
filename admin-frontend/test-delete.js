const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: { endsWith: '@intasela.internal' } }
    });

    if (!user) {
      console.log('No user found');
      return;
    }

    console.log('Attempting to delete user via admin-frontend client:', user.id);
    
    await prisma.user.deleteMany({
      where: { id: user.id }
    });

    console.log('Successfully deleted user via admin-frontend client');
  } catch (error) {
    console.error('Failed to delete user:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
