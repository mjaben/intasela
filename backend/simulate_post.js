const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { NestFactory } = require('@nestjs/core');

// We can just manually call the DB logic since we don't have full Nest context easily here.
// Let's just create a dummy post and then try to run the exact logic.
async function simulate() {
  const settings = await prisma.systemSetting.findUnique({ where: { key: 'monetization_rates' } });
  const rates = settings.value;
  
  const rulesSetting = await prisma.systemSetting.findUnique({ where: { key: 'monetization_rules' } });
  const rules = rulesSetting.value;

  console.log("Using Rates:", rates);
  
  // Find a user
  const user = await prisma.user.findFirst();
  
  // Create a post
  const post = await prisma.post.create({
    data: {
      content: "This is a test post that is long enough to be rewarded hopefully!!",
      authorId: user.id
    }
  });

  console.log("Post created:", post.id);

  // Validate
  const strippedContent = post.content.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]/gu, '');
  if (strippedContent.length < rules.minCharacterCount) {
     console.log("Validation failed: Too short");
     return;
  }
  
  // Anti spam
  if (rates.sela > 0) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: post.authorId },
        data: { walletBalance: { increment: rates.sela } }
      }),
      prisma.post.update({
        where: { id: post.id },
        data: { earned: { increment: rates.sela } }
      }),
      prisma.transaction.create({
        data: {
          amount: rates.sela,
          type: 'POST',
          status: 'COMPLETED',
          userId: post.authorId,
          postId: post.id,
        }
      })
    ]);
    console.log("Reward processed!");
  } else {
    console.log("Rates <= 0, no reward");
  }

  await prisma.$disconnect();
}
simulate();
