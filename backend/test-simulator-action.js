const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const prisma = new PrismaClient();

const mockPostsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'src', 'simulator', 'data', 'mock-posts.json'), 'utf8')
);

function mapInterestToNiche(interest) {
  const techInterests = ["Programming & Software", "Artificial Intelligence", "Gadgets & Consumer Tech", "Technology News", "Science News", "Space & Astronomy"];
  const businessInterests = ["Entrepreneurship", "Investing & Stocks", "Marketing & Advertising", "Small Business", "Economics", "Cryptocurrency & Blockchain"];
  const foodInterests = ["Cooking & Recipes", "Restaurants", "Healthy Eating & Nutrition", "Coffee & Tea"];
  const fitnessInterests = ["Fitness & Exercise", "Yoga & Meditation", "Mental Health"];
  const fashionInterests = ["Men's Fashion", "Women's Fashion", "Beauty & Makeup", "Streetwear"];
  const sportsInterests = ["Football (Soccer)", "Basketball", "Tennis", "Motorsports", "Sports News"];
  const educationInterests = ["Online Learning", "Professional Development", "Job Searching & Careers", "Higher Education"];

  if (techInterests.includes(interest)) return "Tech";
  if (businessInterests.includes(interest)) return "Business";
  if (foodInterests.includes(interest)) return "Food";
  if (fitnessInterests.includes(interest)) return "Fitness";
  if (fashionInterests.includes(interest)) return "Fashion";
  if (sportsInterests.includes(interest)) return "Sports";
  if (educationInterests.includes(interest)) return "Education";
  return "Hobbies";
}

async function generatePostWithOpenAI(user, niche) {
  const systemPrompt = `You are a real, highly active user on the Intasela social media platform (which is similar to X/Twitter).
Your profile details:
- Name: ${user.firstName} ${user.lastName}
- Username: @${user.username}
- Bio: ${user.bio}
- Occupation: ${user.occupation || 'N/A'}
- State/Country: ${user.state ? `${user.state}, ` : ''}${user.country || 'Nigeria'}

Write a short, engaging, natural post (under 280 characters) about the topic "${niche}" that matches your bio and interest.
Rules:
1. Speak in a natural, casual social-media tone.
2. Feel free to use appropriate emojis and Nigerian slangs/pidgin (like 'o', 'na', 'chale', 'abeg', 'jare') where contextually fitting, but keep it readable and highly authentic.
3. DO NOT use hashtags.
4. DO NOT quote your own username or introduce yourself. Just write the post.
5. Keep it conversational.
`;

  const body = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt }
    ],
    max_tokens: 120,
    temperature: 0.85
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI API responded with status ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

async function generateReplyWithOpenAI(user, targetPost) {
  const systemPrompt = `You are a real user on the Intasela social media platform.
Your profile details:
- Name: ${user.firstName} ${user.lastName}
- Username: @${user.username}
- Bio: ${user.bio}

You are replying to a post by ${targetPost.author.firstName} (@${targetPost.author.username}).
Their post content:
"${targetPost.content}"

Write a natural, conversational, and short reply (under 150 characters) to their post.
Rules:
1. Address the post's content directly (agreeing, adding a friendly point, or asking a quick question).
2. Keep it casual and conversational.
3. DO NOT use hashtags.
4. You can tag them using @${targetPost.author.username} naturally in the text if fitting, but don't force it.
`;

  const body = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt }
    ],
    max_tokens: 80,
    temperature: 0.8
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI API responded with status ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

async function testTick() {
  console.log("Running Simulation Verification Tick...");
  console.log("OPENAI_API_KEY Configured:", !!process.env.OPENAI_API_KEY);

  const simulatedUsers = await prisma.user.findMany({
    where: { email: { endsWith: '@intasela.internal' } }
  });

  if (simulatedUsers.length === 0) {
    console.error("No simulated users found. Please run seed-simulator-profiles.js first.");
    return;
  }

  console.log(`Found ${simulatedUsers.length} simulated users.`);

  // Pick a random user
  const user = simulatedUsers[Math.floor(Math.random() * simulatedUsers.length)];
  console.log(`Selected User: @${user.username} (${user.firstName} ${user.lastName})`);

  // Let's force a POST action first to check content generation
  console.log("\n--- Testing POST Action ---");
  const interests = Array.isArray(user.interests) ? user.interests : JSON.parse(user.interests || '[]');
  const randomInterest = interests[Math.floor(Math.random() * interests.length)] || 'Hobbies';
  const niche = mapInterestToNiche(randomInterest);
  console.log(`Interest selected: "${randomInterest}" -> mapped to niche: "${niche}"`);

  let postContent = '';
  if (process.env.OPENAI_API_KEY) {
    try {
      console.log("Calling OpenAI for post generation...");
      postContent = await generatePostWithOpenAI(user, niche);
      console.log("OpenAI Response:", postContent);
    } catch (err) {
      console.error("OpenAI generation failed, using fallback:", err.message);
    }
  }

  if (!postContent) {
    const templates = mockPostsData[niche] || mockPostsData['Hobbies'];
    postContent = templates[Math.floor(Math.random() * templates.length)];
    console.log("Fallback Template Selected:", postContent);
  }

  // Create the post
  const createdPost = await prisma.post.create({
    data: {
      content: postContent,
      authorId: user.id,
      approvalStatus: 'APPROVED',
      status: 'PUBLISHED'
    }
  });
  console.log(`Post successfully saved to Database! Post ID: ${createdPost.id}`);

  // Find another post to reply to
  console.log("\n--- Testing REPLY Action ---");
  const targetPost = await prisma.post.findFirst({
    where: { authorId: { not: user.id }, parentId: null },
    orderBy: { createdAt: 'desc' },
    include: { author: true }
  });

  if (targetPost) {
    console.log(`Found target post for reply: ID ${targetPost.id} by @${targetPost.author.username}: "${targetPost.content}"`);
    let replyContent = '';
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log("Calling OpenAI for reply generation...");
        replyContent = await generateReplyWithOpenAI(user, targetPost);
        console.log("OpenAI Reply Response:", replyContent);
      } catch (err) {
        console.error("OpenAI reply generation failed, using fallback:", err.message);
      }
    }

    if (!replyContent) {
      replyContent = `Nice one, @${targetPost.author.username}! Agree completely.`;
    }

    const createdReply = await prisma.post.create({
      data: {
        content: replyContent,
        authorId: user.id,
        parentId: targetPost.id,
        conversationId: targetPost.conversationId || targetPost.id,
        approvalStatus: 'APPROVED',
        status: 'PUBLISHED'
      }
    });
    console.log(`Reply successfully saved to Database! Reply ID: ${createdReply.id}`);
  } else {
    console.log("No other posts found to reply to.");
  }

  // Liking a post
  console.log("\n--- Testing LIKE Action ---");
  const likeTarget = await prisma.post.findFirst({
    where: { authorId: { not: user.id } },
    orderBy: { createdAt: 'desc' }
  });

  if (likeTarget) {
    // Check if already liked
    const existing = await prisma.engagement.findUnique({
      where: {
        userId_postId_type: {
          userId: user.id,
          postId: likeTarget.id,
          type: 'LIKE'
        }
      }
    });

    if (!existing) {
      await prisma.engagement.create({
        data: {
          type: 'LIKE',
          userId: user.id,
          postId: likeTarget.id
        }
      });
      console.log(`Successfully liked post ${likeTarget.id} by simulated user @${user.username}`);
    } else {
      console.log(`Post ${likeTarget.id} was already liked by @${user.username}`);
    }
  } else {
    console.log("No posts found to like.");
  }

  console.log("\nVerification completed successfully!");
}

testTick()
  .catch(err => console.error("Test tick failed:", err))
  .finally(async () => {
    await prisma.$disconnect();
  });
