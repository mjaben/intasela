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
    // 50% Post, 20% Reply, 20% Like, 10% Re-Sela
    const rand = Math.random();
    if (rand < 0.50) {
      return await this.executePostAction(user);
    } else if (rand < 0.70) {
      return await this.executeReplyAction(user);
    } else if (rand < 0.90) {
      return await this.executeLikeAction(user);
    } else {
      return await this.executeReSelaAction(user);
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
    
    this.logger.log(`Simulated user ${user.username} is writing a new post in niche: ${niche}`);

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

    return `Simulated User @${user.username} created post ${post.id} in niche ${niche}`;
  }

  private async executeReplyAction(user: any): Promise<string> {
    // Find a recent post by someone else that isn't a reply
    const targetPost = await this.prisma.post.findFirst({
      where: {
        authorId: { not: user.id },
        parentId: null
      },
      orderBy: { createdAt: 'desc' },
      include: { author: true }
    });

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
    const targetPost = await this.prisma.post.findFirst({
      where: { authorId: { not: user.id } },
      orderBy: { createdAt: 'desc' }
    });

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
    const targetPost = await this.prisma.post.findFirst({
      where: { authorId: { not: user.id } },
      orderBy: { createdAt: 'desc' }
    });

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
}
