import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MonetizationService } from '../monetization/monetization.service';
import { autoSeedSimulatorProfiles } from './simulator.seeder';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SimulatorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SimulatorService.name);
  private timeoutRef: NodeJS.Timeout | null = null;
  private mockPostsData: Record<string, string[]> = {};

  constructor(
    private prisma: PrismaService,
    private monetizationService: MonetizationService
  ) {
    this.loadMockPosts();
  }

  async onModuleInit() {
    const isEnabled = process.env.SIMULATOR_ENABLED === 'true';
    this.logger.log(`Simulator initialization: enabled = ${isEnabled}`);
    
    if (isEnabled) {
      // Auto-seed profiles if they don't exist
      await autoSeedSimulatorProfiles(this.prisma, this.logger);

      // Schedule the first randomized tick
      this.scheduleNextRun();

      // Run a test tick on-demand 10 seconds after boot to verify everything compiles and works
      setTimeout(() => {
        this.logger.log('Executing startup verification tick...');
        this.runSimulationTick().catch(err => {
          this.logger.error('Startup simulation tick failed:', err);
        });
      }, 10000);
    }
  }

  onModuleDestroy() {
    if (this.timeoutRef) {
      clearTimeout(this.timeoutRef);
    }
  }

  private loadMockPosts() {
    try {
      const filePath = path.join(__dirname, 'data', 'mock-posts.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        this.mockPostsData = JSON.parse(raw);
        this.logger.log('Successfully loaded mock-posts.json fallback data.');
      } else {
        // Look in src/simulator/data/mock-posts.json if __dirname resolves differently
        const altPath = path.join(process.cwd(), 'src', 'simulator', 'data', 'mock-posts.json');
        if (fs.existsSync(altPath)) {
          const raw = fs.readFileSync(altPath, 'utf8');
          this.mockPostsData = JSON.parse(raw);
          this.logger.log('Successfully loaded mock-posts.json from src directory.');
        } else {
          this.logger.warn('mock-posts.json not found. Simulator will require OpenAI API keys to post.');
        }
      }
    } catch (err) {
      this.logger.error('Failed to load mock-posts.json fallback data:', err);
    }
  }

  private scheduleNextRun() {
    if (this.timeoutRef) {
      clearTimeout(this.timeoutRef);
    }

    const minMin = Number(process.env.SIMULATOR_MIN_INTERVAL_MINUTES) || 20;
    const maxMin = Number(process.env.SIMULATOR_MAX_INTERVAL_MINUTES) || 60;
    const delayMs = (Math.random() * (maxMin - minMin) + minMin) * 60 * 1000;

    this.logger.log(`Scheduling next simulator action in ${(delayMs / 60000).toFixed(2)} minutes.`);
    this.timeoutRef = setTimeout(() => {
      this.runSimulationTick()
        .catch(err => this.logger.error('Error during scheduled simulation tick:', err))
        .finally(() => this.scheduleNextRun());
    }, delayMs);
  }

  /**
   * Triggers a single simulation step on-demand
   */
  async triggerSimulationOnDemand(): Promise<string> {
    this.logger.log('Manual simulator trigger received.');
    return await this.runSimulationTick();
  }

  private async runSimulationTick(): Promise<string> {
    const simulatedUsers = await this.prisma.user.findMany({
      where: { email: { endsWith: '@intasela.internal' } }
    });

    if (simulatedUsers.length === 0) {
      const msg = 'No simulated user profiles found in the database. Run the seeding script first.';
      this.logger.warn(msg);
      return msg;
    }

    // Select a random simulated user
    const userIndex = Math.floor(Math.random() * simulatedUsers.length);
    const user = simulatedUsers[userIndex];

    // Roll random action
    // 20% Post, 20% Reply, 20% Like, 15% Quote, 10% Re-Sela, 10% Bookmark, 5% Join Space
    const rand = Math.random();
    if (rand < 0.20) {
      return await this.executePostAction(user);
    } else if (rand < 0.40) {
      return await this.executeReplyAction(user);
    } else if (rand < 0.60) {
      return await this.executeLikeAction(user);
    } else if (rand < 0.75) {
      return await this.executeQuoteAction(user);
    } else if (rand < 0.85) {
      return await this.executeReSelaAction(user);
    } else if (rand < 0.95) {
      return await this.executeBookmarkAction(user);
    } else {
      return await this.executeJoinSpaceAction(user);
    }
  }

  private async executePostAction(user: any): Promise<string> {
    // Determine interests
    let interests: string[] = [];
    if (user.interests) {
      interests = Array.isArray(user.interests) ? user.interests : JSON.parse(user.interests as string);
    }
    
    if (interests.length === 0) {
      interests = ['Hobbies'];
    }

    const randomInterest = interests[Math.floor(Math.random() * interests.length)];
    const niche = this.mapInterestToNiche(randomInterest);
    
    let spaceIdToPost: string | null = null;
    let spaceName = '';
    
    // 30% chance to post in a joined space instead of public feed
    if (Math.random() < 0.30) {
      const userSpaces = await this.prisma.spaceMember.findMany({
        where: { userId: user.id, status: 'ACTIVE' },
        include: { space: true }
      });
      if (userSpaces.length > 0) {
        const selectedSpace = userSpaces[Math.floor(Math.random() * userSpaces.length)];
        spaceIdToPost = selectedSpace.spaceId;
        spaceName = selectedSpace.space.name;
        this.logger.log(`Simulated user ${user.username} is writing a new post in Space: ${spaceName}`);
      }
    }

    if (!spaceIdToPost) {
      this.logger.log(`Simulated user ${user.username} is writing a new post in niche: ${niche}`);
    }

    let content = '';
    
    // Attempt OpenAI generation
    if (process.env.OPENAI_API_KEY) {
      try {
        content = await this.generatePostWithOpenAI(user, niche);
      } catch (err) {
        this.logger.error(`OpenAI post generation failed: ${err.message}. Falling back to templates.`);
      }
    }

    // Fallback to local JSON templates
    if (!content) {
      const templates = this.mockPostsData[niche] || this.mockPostsData['Hobbies'] || ['Hello world!'];
      content = templates[Math.floor(Math.random() * templates.length)];
    }

    // Create the post in the DB
    const post = await this.prisma.post.create({
      data: {
        content,
        authorId: user.id,
        spaceId: spaceIdToPost,
        approvalStatus: 'APPROVED',
        status: 'PUBLISHED'
      }
    });

    this.logger.log(`Created post ${post.id} for simulated user ${user.username}`);

    // Process monetization
    try {
      await this.monetizationService.processSelaReward(post);
    } catch (monError) {
      this.logger.error(`Failed to process monetization reward for post ${post.id}:`, monError);
    }

    if (spaceIdToPost) {
      return `Simulated User @${user.username} created post ${post.id} in Space "${spaceName}"`;
    }
    return `Simulated User @${user.username} created post ${post.id} in niche ${niche}`;
  }

  private async executeReplyAction(user: any): Promise<string> {
    // Find a random recent post by someone else that isn't a reply
    const recentPosts = await this.prisma.post.findMany({
      where: {
        authorId: { not: user.id },
        parentId: null
      },
      orderBy: { createdAt: 'desc' },
      include: { author: true },
      take: 20
    });
    const targetPost = recentPosts.length > 0 ? recentPosts[Math.floor(Math.random() * recentPosts.length)] : null;

    if (!targetPost) {
      this.logger.log('No eligible posts found to reply to. Falling back to writing a new post.');
      return await this.executePostAction(user);
    }

    this.logger.log(`Simulated user ${user.username} is replying to post ${targetPost.id} by @${targetPost.author.username}`);

    let replyContent = '';

    if (process.env.OPENAI_API_KEY) {
      try {
        replyContent = await this.generateReplyWithOpenAI(user, targetPost);
      } catch (err) {
        this.logger.error(`OpenAI reply generation failed: ${err.message}. Falling back to templates.`);
      }
    }

    if (!replyContent) {
      const templates = [
        "Totally agree with this! Well said. 💯",
        "Interesting perspective. Thanks for sharing this!",
        "This is so true, experienced this recently. Thanks for posting!",
        "Great points here. Couldn't have put it better.",
        "Spot on! Really appreciate this insight.",
        "Honestly, this is exactly what we need to hear right now.",
        "Love this! Thanks for sharing @username.",
        "This makes a lot of sense."
      ];
      replyContent = templates[Math.floor(Math.random() * templates.length)].replace('@username', `@${targetPost.author.username}`);
    }

    // Save reply
    const reply = await this.prisma.post.create({
      data: {
        content: replyContent,
        authorId: user.id,
        parentId: targetPost.id,
        conversationId: targetPost.conversationId || targetPost.id,
        approvalStatus: 'APPROVED',
        status: 'PUBLISHED'
      },
      include: { parent: true }
    });

    // Create Notification
    await this.prisma.notification.create({
      data: {
        recipientId: targetPost.authorId,
        actorId: user.id,
        type: 'REPLY',
        postId: reply.id
      }
    }).catch(err => this.logger.error('Failed to create reply notification:', err));

    this.logger.log(`Created reply ${reply.id} for user ${user.username} to post ${targetPost.id}`);

    // Process monetization
    try {
      if (reply.parent) {
        await this.monetizationService.processReplyReward(reply, reply.parent);
      }
    } catch (monError) {
      this.logger.error(`Failed to process monetization reward for reply ${reply.id}:`, monError);
    }

    return `Simulated User @${user.username} replied to post ${targetPost.id} (reply ${reply.id})`;
  }

  private async executeLikeAction(user: any): Promise<string> {
    const recentPosts = await this.prisma.post.findMany({
      where: { authorId: { not: user.id } },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    const targetPost = recentPosts.length > 0 ? recentPosts[Math.floor(Math.random() * recentPosts.length)] : null;

    if (!targetPost) {
      return 'No target post to like.';
    }

    this.logger.log(`Simulated user ${user.username} is liking post ${targetPost.id}`);

    // Check if already liked
    const existing = await this.prisma.engagement.findUnique({
      where: {
        userId_postId_type: {
          userId: user.id,
          postId: targetPost.id,
          type: 'LIKE'
        }
      }
    });

    if (existing) {
      return `Simulated User @${user.username} already liked post ${targetPost.id}`;
    }

    await this.prisma.engagement.create({
      data: {
        type: 'LIKE',
        userId: user.id,
        postId: targetPost.id
      }
    });

    // Create Notification
    await this.prisma.notification.create({
      data: {
        recipientId: targetPost.authorId,
        actorId: user.id,
        type: 'LIKE',
        postId: targetPost.id
      }
    }).catch(err => this.logger.error('Failed to create like notification:', err));

    return `Simulated User @${user.username} liked post ${targetPost.id}`;
  }

  private async executeReSelaAction(user: any): Promise<string> {
    const recentPosts = await this.prisma.post.findMany({
      where: { authorId: { not: user.id } },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    const targetPost = recentPosts.length > 0 ? recentPosts[Math.floor(Math.random() * recentPosts.length)] : null;

    if (!targetPost) {
      return 'No target post to re-sela.';
    }

    this.logger.log(`Simulated user ${user.username} is re-posting (Re-Sela) post ${targetPost.id}`);

    const existing = await this.prisma.engagement.findUnique({
      where: {
        userId_postId_type: {
          userId: user.id,
          postId: targetPost.id,
          type: 'RESELA'
        }
      }
    });

    if (existing) {
      return `Simulated User @${user.username} already re-posted post ${targetPost.id}`;
    }

    await this.prisma.engagement.create({
      data: {
        type: 'RESELA',
        userId: user.id,
        postId: targetPost.id
      }
    });

    // Create Notification
    await this.prisma.notification.create({
      data: {
        recipientId: targetPost.authorId,
        actorId: user.id,
        type: 'RESELA',
        postId: targetPost.id
      }
    }).catch(err => this.logger.error('Failed to create re-sela notification:', err));

    return `Simulated User @${user.username} re-sela'd post ${targetPost.id}`;
  }

  private async executeQuoteAction(user: any): Promise<string> {
    const recentPosts = await this.prisma.post.findMany({
      where: { authorId: { not: user.id } },
      orderBy: { createdAt: 'desc' },
      include: { author: true },
      take: 20
    });
    const targetPost = recentPosts.length > 0 ? recentPosts[Math.floor(Math.random() * recentPosts.length)] : null;

    if (!targetPost) {
      return 'No target post to quote.';
    }

    this.logger.log(`Simulated user ${user.username} is quoting (Re-Sela with note) post ${targetPost.id}`);

    let quoteContent = '';

    if (process.env.OPENAI_API_KEY) {
      try {
        quoteContent = await this.generateQuoteWithOpenAI(user, targetPost);
      } catch (err) {
        this.logger.error(`OpenAI quote generation failed: ${err.message}. Falling back to templates.`);
      }
    }

    if (!quoteContent) {
      const templates = [
        "This is incredibly accurate. 👇",
        "Had to share this one.",
        "Couldn't agree more with this.",
        "Take a look at this!",
        "Interesting thoughts here.",
        "This deserves more attention."
      ];
      quoteContent = templates[Math.floor(Math.random() * templates.length)];
    }

    // Create the quote post
    const quote = await this.prisma.post.create({
      data: {
        content: quoteContent,
        authorId: user.id,
        quotedPostId: targetPost.id,
        approvalStatus: 'APPROVED',
        status: 'PUBLISHED'
      }
    });

    // Create Notification
    await this.prisma.notification.create({
      data: {
        recipientId: targetPost.authorId,
        actorId: user.id,
        type: 'RESELA', // Using RESELA type for quotes as well for now
        postId: quote.id
      }
    }).catch(err => this.logger.error('Failed to create quote notification:', err));

    return `Simulated User @${user.username} quoted post ${targetPost.id}`;
  }

  private async executeBookmarkAction(user: any): Promise<string> {
    const recentPosts = await this.prisma.post.findMany({
      where: { authorId: { not: user.id } },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    const targetPost = recentPosts.length > 0 ? recentPosts[Math.floor(Math.random() * recentPosts.length)] : null;

    if (!targetPost) {
      return 'No target post to bookmark.';
    }

    this.logger.log(`Simulated user ${user.username} is bookmarking post ${targetPost.id}`);

    const existing = await this.prisma.engagement.findUnique({
      where: {
        userId_postId_type: {
          userId: user.id,
          postId: targetPost.id,
          type: 'BOOKMARK'
        }
      }
    });

    if (existing) {
      return `Simulated User @${user.username} already bookmarked post ${targetPost.id}`;
    }

    await this.prisma.engagement.create({
      data: {
        type: 'BOOKMARK',
        userId: user.id,
        postId: targetPost.id
      }
    });

    return `Simulated User @${user.username} bookmarked post ${targetPost.id}`;
  }

  private async executeJoinSpaceAction(user: any): Promise<string> {
    // Find a random PUBLIC space the user is not a member of
    const spaces = await this.prisma.space.findMany({
      where: {
        type: 'PUBLIC',
        members: {
          none: { userId: user.id }
        }
      },
      take: 50
    });

    if (spaces.length === 0) {
      return 'No public spaces available to join.';
    }

    const randomSpace = spaces[Math.floor(Math.random() * spaces.length)];

    await this.prisma.spaceMember.create({
      data: {
        spaceId: randomSpace.id,
        userId: user.id,
        role: 'MEMBER',
        status: 'ACTIVE',
        hasApprovedPost: true
      }
    });

    this.logger.log(`Simulated user ${user.username} joined space ${randomSpace.name}`);
    return `Simulated User @${user.username} joined Space "${randomSpace.name}"`;
  }

  private mapInterestToNiche(interest: string): string {
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

  private async generatePostWithOpenAI(user: any, niche: string): Promise<string> {
    const newsUsers = ['naijanews360', 'goal_nigeria', 'celeb_gossip', 'politics_nigeria', 'cruise_nation', 'afrobeat_news', 'food_daily', 'business_news', 'trending_daily', 'scholarship_shop'];
    let systemPrompt = `You are a real, highly active user on the Intasela social media platform (which is similar to X/Twitter).
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

    if (newsUsers.includes(user.username)) {
      try {
        const queryMap: Record<string, string> = {
          'naijanews360': 'Nigeria Breaking News',
          'goal_nigeria': 'Nigeria Super Eagles Football',
          'celeb_gossip': 'Nigeria Entertainment Nollywood Gossip',
          'politics_nigeria': 'Nigeria Politics',
          'cruise_nation': 'Nigeria Trending',
          'afrobeat_news': 'Afrobeats Music Nigeria',
          'food_daily': 'Nigeria Food Recipes',
          'business_news': 'Nigeria Business Economy',
          'trending_daily': 'Nigeria News',
          'scholarship_shop': 'Scholarships Study Abroad Nigeria'
        };
        const query = queryMap[user.username] || 'Nigeria News';
        const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-NG&gl=NG&ceid=NG:en`;
        const rssRes = await fetch(url);
        if (rssRes.ok) {
          const xml = await rssRes.text();
          const titles = [...xml.matchAll(/<item>[\s\S]*?<title>(.*?)<\/title>/g)].map(m => m[1]);
          if (titles.length > 0) {
            const headline = titles[Math.floor(Math.random() * Math.min(10, titles.length))];
            systemPrompt = `You are a news reporter on the Intasela social media platform.
Your profile details:
- Name: ${user.firstName} ${user.lastName}
- Username: @${user.username}

You just found this breaking headline: "${headline.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'")}"

Write a short, engaging news post (under 280 characters) summarizing or reporting this headline to your followers.
Rules:
1. Speak like a modern news blog (e.g. "JUST IN:", "Breaking:", or just an engaging statement).
2. DO NOT use hashtags.
3. DO NOT include any links or URLs. Just post the summary text.
`;
          }
        }
      } catch (e) {
        this.logger.error('Failed to scrape RSS news:', e);
      }
    }

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

    const data: any = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  }

  private async generateReplyWithOpenAI(user: any, targetPost: any): Promise<string> {
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

    const data: any = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  }

  private async generateQuoteWithOpenAI(user: any, targetPost: any): Promise<string> {
    const systemPrompt = `You are a real user on the Intasela social media platform.
Your profile details:
- Name: ${user.firstName} ${user.lastName}
- Username: @${user.username}
- Bio: ${user.bio}

You are quoting (retweeting with a note) a post by ${targetPost.author.firstName} (@${targetPost.author.username}).
Their post content:
"${targetPost.content}"

Write a natural, conversational, and short note (under 100 characters) to accompany the quoted post.
Rules:
1. Add your own brief thought, opinion, or endorsement of their post.
2. Keep it casual and conversational.
3. DO NOT use hashtags.
4. DO NOT quote their username unless necessary.
`;

    const body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt }
      ],
      max_tokens: 60,
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

    const data: any = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  }
}
