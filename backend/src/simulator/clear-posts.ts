import { PrismaClient } from '@prisma/client';

async function clearAllPosts() {
  const prisma = new PrismaClient();
  try {
    console.log('Initiating database cleanup: Deleting all posts...');
    
    // Deleting all posts will cascade delete all Engagements, Notifications, Polls, PollOptions, PollVotes, and Transactions
    const result = await prisma.post.deleteMany({});
    
    console.log(`Successfully deleted ${result.count} posts from the database!`);
  } catch (error) {
    console.error('Error clearing database posts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllPosts();
