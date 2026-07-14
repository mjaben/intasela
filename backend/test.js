const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const post = await prisma.post.findUnique({ where: { id: 22 } });
  
  const rulesRaw = await prisma.$queryRaw`SELECT value FROM SystemSetting WHERE \`key\` = 'monetization_rules'`;
  const rules = typeof rulesRaw[0].value === 'string' ? JSON.parse(rulesRaw[0].value) : rulesRaw[0].value;
  console.log('Rules:', rules);
  
  const content = post.content;
  const strippedContent = content.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]/gu, '');
  
  console.log('Content:', content);
  console.log('Stripped length:', strippedContent.length);
  
  if (strippedContent.length < rules.minCharacterCount) {
    console.log('Failed min char count');
  } else {
    console.log('Passed char count');
  }
  
  const duplicateCount = await prisma.post.count({ where: { authorId: post.authorId, content: post.content } });
  console.log('Duplicate count:', duplicateCount);
}

test().catch(console.error).finally(() => prisma.$disconnect());
