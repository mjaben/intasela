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

    // Determine current hour in West Africa Time (GMT+1) / server time
    const lagosTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }));
    const hour = lagosTime.getHours();

    let delayMs = 4 * 60 * 1000; // default 4 mins (Normal)
    let modeName = 'Normal';

    // Circadian Rhythm Pacing
    if ((hour >= 7 && hour <= 9) || (hour >= 18 && hour <= 22)) {
      // Peak Hours (7AM-9AM, 6PM-10PM): 2 minutes
      delayMs = 2 * 60 * 1000;
      modeName = 'Peak';
    } else if (hour >= 0 && hour <= 6) {
      // Night Hours (12AM-6AM): 20 minutes (slower pacing to mimic sleep)
      delayMs = 20 * 60 * 1000;
      modeName = 'Night';
    } else {
      // Off-Peak/Day Hours: 5 minutes
      delayMs = 5 * 60 * 1000;
      modeName = 'Day';
    }

    this.logger.log(`[Circadian Rhythm] Current time: ${lagosTime.toLocaleTimeString()} (${modeName} Mode). Next tick in ${delayMs / 60000} minutes.`);
    
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
      return 'No simulated user profiles found in the database. Run the seeding script first.';
    }

    let actionsTaken = 0;
    const actionsLog: string[] = [];

    // Engagement Cascade Logic: Find all posts created in the last 60 minutes
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentPosts = await this.prisma.post.findMany({
      where: { 
        createdAt: { gte: oneHourAgo },
        parentId: null 
      },
      include: { author: true }
    });

    for (const post of recentPosts) {
      // Determine deterministic targets based on post ID
      const targetLikes = 15 + (post.id % 15); // 15 to 29
      const targetReplies = 5 + (post.id % 10); // 5 to 14
      const targetQuotes = 5 + (post.id % 6); // 5 to 10
      const targetReSelas = 5 + (post.id % 6); // 5 to 10
      const targetBookmarks = 5 + (post.id % 10); // 5 to 14

      // Current counts
      const likeCount = await this.prisma.engagement.count({ where: { postId: post.id, type: 'LIKE' } });
      const replyCount = await this.prisma.post.count({ where: { parentId: post.id, quotedPostId: null } });
      const quoteCount = await this.prisma.post.count({ where: { quotedPostId: post.id } });
      const reselaCount = await this.prisma.engagement.count({ where: { postId: post.id, type: 'RESELA' } });
      const bookmarkCount = await this.prisma.engagement.count({ where: { postId: post.id, type: 'BOOKMARK' } });

      // Determine deficit
      const deficits = [];
      if (likeCount < targetLikes) deficits.push('LIKE');
      if (replyCount < targetReplies) deficits.push('REPLY');
      if (quoteCount < targetQuotes) deficits.push('QUOTE');
      if (reselaCount < targetReSelas) deficits.push('RESELA');
      if (bookmarkCount < targetBookmarks) deficits.push('BOOKMARK');

      // Process deficits progressively (guaranteeing we find users who haven't acted yet)
      if (deficits.length > 0) {
        // Limit to max 3 deficits per tick per post to keep it looking natural
        const actionsToProcess = deficits.sort(() => 0.5 - Math.random()).slice(0, 3);

        for (const actionToTake of actionsToProcess) {
          // Retrieve candidates who are not the post author
          const potentialActors = simulatedUsers.filter(u => u.id !== post.authorId);
          
          // Query Follows table to see which candidates follow the post author
          const followersOfAuthor = await this.prisma.follows.findMany({
            where: {
              followingId: post.authorId,
              followerId: { in: potentialActors.map(u => u.id) }
            }
          });
          const followerIds = followersOfAuthor.map(f => f.followerId);

          // Partition candidates: followers first, then others (both shuffled)
          const followers = potentialActors.filter(u => followerIds.includes(u.id)).sort(() => 0.5 - Math.random());
          const nonFollowers = potentialActors.filter(u => !followerIds.includes(u.id)).sort(() => 0.5 - Math.random());
          
          const shuffledUsers = [...followers, ...nonFollowers];
          let validUser = null;

          // Find a user who hasn't done this specific action yet
          for (const user of shuffledUsers) {
            let alreadyDidIt = false;
            
            if (actionToTake === 'LIKE' || actionToTake === 'RESELA' || actionToTake === 'BOOKMARK') {
              const count = await this.prisma.engagement.count({
                where: { userId: user.id, postId: post.id, type: actionToTake as any }
              });
              if (count > 0) alreadyDidIt = true;
            } else if (actionToTake === 'REPLY') {
              const count = await this.prisma.post.count({
                where: { authorId: user.id, parentId: post.id, quotedPostId: null }
              });
              if (count > 0) alreadyDidIt = true;
            } else if (actionToTake === 'QUOTE') {
              const count = await this.prisma.post.count({
                where: { authorId: user.id, quotedPostId: post.id }
              });
              if (count > 0) alreadyDidIt = true;
            }

            if (!alreadyDidIt) {
              validUser = user;
              break;
            }
          }

          if (validUser) {
            try {
              if (actionToTake === 'LIKE') actionsLog.push(await this.executeLikeAction(validUser, post));
              else if (actionToTake === 'REPLY') actionsLog.push(await this.executeReplyAction(validUser, post));
              else if (actionToTake === 'QUOTE') actionsLog.push(await this.executeQuoteAction(validUser, post));
              else if (actionToTake === 'RESELA') actionsLog.push(await this.executeReSelaAction(validUser, post));
              else if (actionToTake === 'BOOKMARK') actionsLog.push(await this.executeBookmarkAction(validUser, post));
              actionsTaken++;
            } catch(e) { this.logger.error(e); }
          }
        }
      }

      // Author Reply Logic
      if (post.author.email.endsWith('@intasela.internal')) {
        // If the author is a simulated user, they should reply to max 5 comments
        const comments = await this.prisma.post.findMany({ 
          where: { parentId: post.id, authorId: { not: post.authorId } },
          include: { author: true }
        });
        if (comments.length > 0) {
          const authorReplies = await this.prisma.post.count({ where: { parentId: post.id, authorId: post.authorId } });
          if (authorReplies < 5 && Math.random() < 0.20) {
            // Reply to a random comment
            const commentToReply = comments[Math.floor(Math.random() * comments.length)];
            try {
              actionsLog.push(await this.executeReplyAction(post.author, commentToReply));
              actionsTaken++;
            } catch(e) { this.logger.error(e); }
          }
        }
      }
    }

    // Guarantee EXACTLY 1 post on main feed per tick, biased by Weekend vs Weekday
    const lagosTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }));
    const dayOfWeek = lagosTime.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 5; // Friday, Saturday, Sunday

    let selectedMainUser = null;
    const weekendUsers = ['goal_nigeria', 'celeb_gossip', 'cruise_nation', 'afrobeat_news'];
    const weekdayUsers = ['politics_nigeria', 'business_news', 'naijanews360', 'trending_daily', 'scholarship_shop', 'food_daily'];

    // 80% chance to follow weekend/weekday bias
    if (Math.random() < 0.8) {
      const targetList = isWeekend ? weekendUsers : weekdayUsers;
      const candidates = simulatedUsers.filter(u => targetList.includes(u.username));
      if (candidates.length > 0) {
        selectedMainUser = candidates[Math.floor(Math.random() * candidates.length)];
      }
    }

    if (!selectedMainUser) {
      selectedMainUser = simulatedUsers[Math.floor(Math.random() * simulatedUsers.length)];
    }

    actionsLog.push(await this.executePostAction(selectedMainUser, false));
    actionsTaken++;

    // Guarantee EXACTLY 1 post in a space per tick
    const spaceUser = simulatedUsers[Math.floor(Math.random() * simulatedUsers.length)];
    actionsLog.push(await this.executePostAction(spaceUser, true));
    actionsTaken++;

    // Guarantee EXACTLY 1 quote (ReSela with Note) per tick
    if (recentPosts.length > 0) {
      const quoteUser = simulatedUsers[Math.floor(Math.random() * simulatedUsers.length)];
      const postToQuote = recentPosts[Math.floor(Math.random() * recentPosts.length)];
      if (quoteUser.id !== postToQuote.authorId) {
        try {
          actionsLog.push(await this.executeQuoteAction(quoteUser, postToQuote));
          actionsTaken++;
        } catch(e) {}
      }
    }

    if (actionsTaken === 0) {
      return 'Tick processed, no actions were taken this round to maintain gradual pacing.';
    }

    return `Tick processed. Took ${actionsTaken} actions:\n` + actionsLog.join('\n');
  }

  private async executePostAction(user: any, forceSpace: boolean = false): Promise<string> {
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
    
    if (forceSpace) {
      const userSpaces = await this.prisma.spaceMember.findMany({
        where: { userId: user.id, status: 'ACTIVE' },
        include: { space: true }
      });
      if (userSpaces.length > 0) {
        const selectedSpace = userSpaces[Math.floor(Math.random() * userSpaces.length)];
        spaceIdToPost = selectedSpace.spaceId;
        spaceName = selectedSpace.space.name;
        this.logger.log(`Simulated user ${user.username} is writing a new post in Space: ${spaceName}`);
      } else {
        return `Simulated user ${user.username} has no spaces to post in. Skipping space post.`;
      }
    } else {
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

  private async executeReplyAction(user: any, targetPost: any): Promise<string> {
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

  private async executeLikeAction(user: any, targetPost: any): Promise<string> {
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

  private async executeReSelaAction(user: any, targetPost: any): Promise<string> {
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

  private async executeQuoteAction(user: any, targetPost: any): Promise<string> {
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

  private async executeBookmarkAction(user: any, targetPost: any): Promise<string> {
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

  private getPersonalityPrompt(username: string): string {
    const personalityMap: Record<string, string> = {
      'naijanews360': 'You are a professional, objective, and authoritative Nigerian news reporter. Keep it informative, clear, and formal.',
      'goal_nigeria': 'You are an absolute sports fanatic and die-hard Super Eagles / Football follower. Talk with high energy, extreme passion, and use sports slang (e.g. "We move!", "Chale!", "Goal!").',
      'celeb_gossip': 'You are a sassy, gossip-loving Nollywood and entertainment enthusiast. Use wordplay, gossipy phrases like "spilling the tea", "hot gist", "our fave", and speak with a highly casual, animated, and friendly vibe.',
      'politics_nigeria': 'You are an analytical, serious, and policy-minded political observer. Speak logically, focus on governance, stats, and ask critical questions.',
      'cruise_nation': 'You are a funny, highly sarcastic, and savage member of the "Cruise Nation". Use popular Nigerian internet slangs, memes, pidgin English naturally (e.g., "no cap", "cruise", "abeg"), and keep it lighthearted but witty.',
      'afrobeat_news': 'You are a music industry pundit and massive Afrobeats fanboy/fangirl. Talk about charts, streams, fire emojis, new releases, and defend your favorite artists passionately.',
      'food_daily': 'You are a warm, descriptive, and inviting chef/foodie. Use rich descriptions of flavor, recipes, and home-cooking warmth (e.g. "deliciousness", "mouthwatering").',
      'business_news': 'You are a corporate business analyst. Focus on market numbers, inflation, startup funding, and exchange rates with professional clarity.',
      'trending_daily': 'You write direct, breaking hot-topic news. Short, snappy sentences that get right to the point.',
      'scholarship_shop': 'You are a highly encouraging, helpful study-abroad advisor. Share educational opportunities, scholarships, tips, and maintain an inspiring, supportive, and resource-heavy tone.'
    };
    return personalityMap[username] || 'You are a friendly, casual social media user. Keep it natural, conversational, and direct.';
  }

  private async generatePostWithOpenAI(user: any, niche: string): Promise<string> {
    const newsUsers = ['naijanews360', 'goal_nigeria', 'celeb_gossip', 'politics_nigeria', 'cruise_nation', 'afrobeat_news', 'food_daily', 'business_news', 'trending_daily', 'scholarship_shop'];
    const personalityPrompt = this.getPersonalityPrompt(user.username);
    
    let systemPrompt = `You are a real, highly active user on the Intasela social media platform (which is similar to X/Twitter).
Your profile details:
- Name: ${user.firstName} ${user.lastName}
- Username: @${user.username}
- Bio: ${user.bio}
- Occupation: ${user.occupation || 'N/A'}
- State/Country: ${user.state ? `${user.state}, ` : ''}${user.country || 'Nigeria'}

Personality Guide: ${personalityPrompt}

Write a short, engaging, natural post (under 280 characters) about the topic "${niche}" that matches your bio and interest.
Rules:
1. Speak strictly in the tone designated by your Personality Guide.
2. Speak in a natural, casual social-media tone.
3. Feel free to use appropriate emojis and Nigerian slangs/pidgin (like 'o', 'na', 'chale', 'abeg', 'jare') where contextually fitting, but keep it readable and highly authentic.
4. DO NOT use hashtags.
5. DO NOT quote your own username or introduce yourself. Just write the post.
6. Keep it conversational.
`;

    if (newsUsers.includes(user.username)) {
      try {
        const queryMap: Record<string, { query: string; nicheDef: string }> = {
          'naijanews360': { query: 'Nigeria News', nicheDef: 'General Nigerian News & Breaking Updates' },
          'goal_nigeria': { query: 'Football Soccer', nicheDef: 'Football (Soccer) & Sports updates' },
          'celeb_gossip': { query: 'Nigeria Entertainment Nollywood', nicheDef: 'Entertainment, Nollywood, & Celebrity Gossip' },
          'politics_nigeria': { query: 'Nigeria Politics', nicheDef: 'Nigerian Politics, Government, & Elections' },
          'cruise_nation': { query: 'Nigeria trending', nicheDef: 'Humor, Memes, & Viral Internet Trends' },
          'afrobeat_news': { query: 'Afrobeats Music Nigeria', nicheDef: 'Nigerian Music Industry & Afrobeats' },
          'food_daily': { query: 'Nigeria Food Recipes', nicheDef: 'Culinary Arts & Nigerian Cuisine' },
          'business_news': { query: 'Nigeria Business Economy', nicheDef: 'Finance, Startups, & Nigerian Economy' },
          'trending_daily': { query: 'Nigeria News', nicheDef: 'Viral Internet Culture & Breaking Hot Topics' },
          'scholarship_shop': { query: 'Scholarships Study Abroad Nigeria', nicheDef: 'Education, Career Opportunities, & Scholarships' }
        };
        const nicheData = queryMap[user.username] || { query: 'Nigeria News', nicheDef: 'General News' };
        
        // Try scraping news from last 6 hours
        let url = `https://news.google.com/rss/search?q=${encodeURIComponent(nicheData.query + ' when:6h')}&hl=en-NG&gl=NG&ceid=NG:en`;
        let rssRes = await fetch(url);
        let xml = '';
        if (rssRes.ok) {
          xml = await rssRes.text();
        }
        
        // Fallback to last 24 hours if 6 hours is too narrow/empty
        if (!xml || !xml.includes('<item>')) {
          url = `https://news.google.com/rss/search?q=${encodeURIComponent(nicheData.query + ' when:24h')}&hl=en-NG&gl=NG&ceid=NG:en`;
          rssRes = await fetch(url);
          if (rssRes.ok) {
            xml = await rssRes.text();
          }
        }

        if (xml) {
          const titles = [...xml.matchAll(/<item>[\s\S]*?<title>(.*?)<\/title>/g)].map(m => m[1]);
          if (titles.length > 0) {
            const headline = titles[Math.floor(Math.random() * Math.min(10, titles.length))];
            systemPrompt = `You are a niche reporter on the Intasela social media platform.
Your profile details:
- Name: ${user.firstName} ${user.lastName}
- Username: @${user.username}
- Your Strict Niche Focus: ${nicheData.nicheDef}

Personality Guide: ${personalityPrompt}

You just found this recent breaking headline: "${headline.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'")}"

Write a short, engaging news post (under 280 characters) summarizing or reporting this headline to your followers.
Rules:
1. Speak strictly in the tone designated by your Personality Guide and your niche focus.
2. Make it sound like a fresh update ("JUST IN:", "Breaking:", etc.).
3. DO NOT use hashtags.
4. DO NOT include any links or URLs. Just post the summary text.
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
    const personalityPrompt = this.getPersonalityPrompt(user.username);
    const systemPrompt = `You are a user on the Intasela social media platform.
Your profile details:
- Name: ${user.firstName} ${user.lastName}
- Username: @${user.username}
- Bio: ${user.bio}

Personality Guide: ${personalityPrompt}

You are replying to a post by ${targetPost.author.firstName} (@${targetPost.author.username}).
Their post content:
"${targetPost.content}"

Write a natural, conversational, and short reply (under 150 characters) to their post.
Rules:
1. Speak strictly in the tone designated by your Personality Guide.
2. Address the post's content directly (agreeing, adding a friendly point, or asking a quick question).
3. Keep it casual and conversational.
4. DO NOT use hashtags.
5. You can tag them using @${targetPost.author.username} naturally in the text if fitting, but don't force it.
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
    const personalityPrompt = this.getPersonalityPrompt(user.username);
    const systemPrompt = `You are a user on the Intasela social media platform.
Your profile details:
- Name: ${user.firstName} ${user.lastName}
- Username: @${user.username}
- Bio: ${user.bio}

Personality Guide: ${personalityPrompt}

You are quoting (retweeting with a note) a post by ${targetPost.author.firstName} (@${targetPost.author.username}).
Their post content:
"${targetPost.content}"

Write a natural, conversational, and short note (under 100 characters) to accompany the quoted post.
Rules:
1. Speak strictly in the tone designated by your Personality Guide.
2. Add your own brief thought, opinion, or endorsement of their post.
3. Keep it casual and conversational.
4. DO NOT use hashtags.
5. DO NOT quote their username unless necessary.
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
