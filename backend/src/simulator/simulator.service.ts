import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MonetizationService } from '../monetization/monetization.service';
import { autoSeedSimulatorProfiles } from './simulator.seeder';
import * as fs from 'fs';
import * as path from 'path';

interface ScheduledAction {
  id: string;
  postId: number;
  postAuthorId: string;
  actorId: string;
  actorUsername: string;
  type: 'LIKE' | 'REPLY' | 'RESELA' | 'QUOTE' | 'BOOKMARK';
  executeAt: Date;
  niche: string;
}

@Injectable()
export class SimulatorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SimulatorService.name);
  private mockPostsData: Record<string, string[]> = {};
  
  private timeoutRef: NodeJS.Timeout | null = null;
  private queueIntervalRef: NodeJS.Timeout | null = null;
  
  private normalUsers: any[] = [];
  private newsUsers: any[] = [];
  private lastUserIndex = 0;
  
  private scheduledQueue: ScheduledAction[] = [];
  private userCooldowns: Record<string, number> = {}; // username -> last action timestamp
  private newsNextPostTimes: Record<string, number> = {}; // username -> next post timestamp
  private nextNormalUserPostTime = 0;
  private processedPostIds = new Set<number>();

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
      // Auto-seed profiles
      await autoSeedSimulatorProfiles(this.prisma, this.logger);
      
      // Load user lists
      await this.loadUsersList();
      
      // Initialize news post schedules (staggered 5 mins apart)
      this.initNewsSchedules();
      
      // Set first normal user post time to 2 minutes from now
      this.nextNormalUserPostTime = Date.now() + 2 * 60 * 1000;

      // Start core organic loops
      this.startPostingLoop();
      this.startQueueProcessingLoop();
      
      this.logger.log('Organic Engagement Simulator Engine successfully started.');

      // Verification on-demand post after boot
      setTimeout(async () => {
        this.logger.log('Executing startup verification tick...');
        try {
          const log = await this.runSimulationTick();
          this.logger.log(`Startup verification complete: ${log}`);
        } catch (err) {
          this.logger.error('Startup simulation tick failed:', err);
        }
      }, 10000);
    }
  }

  onModuleDestroy() {
    if (this.timeoutRef) clearInterval(this.timeoutRef);
    if (this.queueIntervalRef) clearInterval(this.queueIntervalRef);
  }

  private async loadUsersList() {
    const allSimulated = await this.prisma.user.findMany({
      where: { email: { endsWith: '@intasela.internal' } }
    });
    
    const newsUsernames = [
      'naijanews360', 'goal_nigeria', 'celeb_gossip', 'politics_nigeria', 
      'cruise_nation', 'afrobeat_news', 'food_daily', 'business_news', 
      'trending_daily', 'scholarship_shop'
    ];
    
    this.normalUsers = allSimulated.filter(u => !newsUsernames.includes(u.username));
    this.newsUsers = allSimulated.filter(u => newsUsernames.includes(u.username));
    
    this.logger.log(`Loaded ${this.normalUsers.length} normal users and ${this.newsUsers.length} news pages.`);
  }

  private initNewsSchedules() {
    const now = Date.now();
    let index = 0;
    for (const u of this.newsUsers) {
      // Stagger news page initial posts strictly 5 minutes apart from each other
      this.newsNextPostTimes[u.username] = now + (index * 5 * 60 * 1000);
      index++;
    }
  }

  private startPostingLoop() {
    // Centralized Posting Check Loop (Every 30 seconds)
    // Enforces concurrency rule: Only ONE post can be created globally at any given moment
    this.timeoutRef = setInterval(async () => {
      try {
        const now = Date.now();

        // 1. Check Normal User Posting Schedule (Sequentially, every 2 minutes)
        if (now >= this.nextNormalUserPostTime) {
          if (this.normalUsers.length > 0) {
            const user = this.normalUsers[this.lastUserIndex];
            this.lastUserIndex = (this.lastUserIndex + 1) % this.normalUsers.length;
            
            // Handle skipping posts for Readers/Quiet users
            const personality = this.getUserPersonality(user.username);
            let shouldSkip = false;
            if (personality === 'Reader' && Math.random() < 0.8) shouldSkip = true;
            if (personality === 'Quiet' && Math.random() < 0.6) shouldSkip = true;
            
            if (shouldSkip) {
              this.logger.log(`[Posting Loop] Skipping post for @${user.username} (personality-based skip)`);
              // Still advance schedule by 2 minutes
              this.nextNormalUserPostTime = now + 2 * 60 * 1000;
              return; // Exit tick to prevent double posts
            }

            const postLog = await this.executePostAction(user, false);
            this.logger.log(`[Posting Loop] ${postLog}`);
            
            this.nextNormalUserPostTime = now + 2 * 60 * 1000;
            return; // Exit tick immediately to guarantee concurrency isolation
          }
        }

        // 2. Check News Page Posting Schedules
        const intervals: Record<string, number> = {
          'naijanews360': 20 * 60 * 1000,
          'goal_nigeria': 25 * 60 * 1000,
          'celeb_gossip': 30 * 60 * 1000,
          'politics_nigeria': 35 * 60 * 1000,
          'cruise_nation': 40 * 60 * 1000,
          'afrobeat_news': 45 * 60 * 1000,
          'food_daily': 50 * 60 * 1000,
          'business_news': 55 * 60 * 1000,
          'trending_daily': 60 * 60 * 1000,
          'scholarship_shop': 90 * 60 * 1000,
        };

        for (const u of this.newsUsers) {
          const nextTime = this.newsNextPostTimes[u.username] || 0;
          if (now >= nextTime) {
            const postLog = await this.executePostAction(u, false);
            this.logger.log(`[News Loop] ${postLog}`);
            
            const interval = intervals[u.username] || 30 * 60 * 1000;
            // Add a little stagger randomness (+/- 3 minutes)
            const randomStagger = (Math.random() * 6 - 3) * 60 * 1000;
            this.newsNextPostTimes[u.username] = now + interval + randomStagger;
            
            return; // Exit tick immediately to ensure news post drops on its own
          }
        }
      } catch (err) {
        this.logger.error('Error in centralized posting loop:', err);
      }
    }, 30 * 1000);
  }

  private startQueueProcessingLoop() {
    this.queueIntervalRef = setInterval(async () => {
      try {
        const now = Date.now();
        
        // 1. Process scheduled actions
        const readyActions = this.scheduledQueue.filter(a => now >= a.executeAt.getTime());
        
        for (const action of readyActions) {
          this.scheduledQueue = this.scheduledQueue.filter(a => a.id !== action.id);
          
          // Cooldown check (30-90 seconds)
          const lastActionTime = this.userCooldowns[action.actorUsername] || 0;
          const cooldownPeriod = (30 + Math.random() * 60) * 1000;
          
          if (now - lastActionTime < cooldownPeriod) {
            // Push back by 30 seconds to respect cooldown boundaries
            action.executeAt = new Date(now + 30 * 1000);
            this.scheduledQueue.push(action);
            continue;
          }

          try {
            const actorObj = [...this.normalUsers, ...this.newsUsers].find(u => u.id === action.actorId);
            if (!actorObj) continue;

            const postObj = await this.prisma.post.findUnique({
              where: { id: action.postId },
              include: { author: true }
            });
            if (!postObj) continue;

            let logMsg = '';
            if (action.type === 'LIKE') {
              logMsg = await this.executeLikeAction(actorObj, postObj);
            } else if (action.type === 'REPLY') {
              logMsg = await this.executeReplyAction(actorObj, postObj);
              
              // 30% chance for news page to reply back on comments to their posts
              const isNewsPost = this.newsUsers.some(u => u.id === postObj.authorId);
              if (isNewsPost && Math.random() < 0.3) {
                const replyObj = await this.prisma.post.findFirst({
                  where: { authorId: actorObj.id, parentId: postObj.id },
                  orderBy: { createdAt: 'desc' }
                });
                if (replyObj) {
                  const delay = (1 + Math.random() * 2) * 60 * 1000;
                  this.pushToQueue(replyObj.id, actorObj.id, postObj.author, 'REPLY', now + delay, action.niche);
                }
              }
            } else if (action.type === 'RESELA') {
              logMsg = await this.executeReSelaAction(actorObj, postObj);
            } else if (action.type === 'QUOTE') {
              logMsg = await this.executeQuoteAction(actorObj, postObj);
            } else if (action.type === 'BOOKMARK') {
              logMsg = await this.executeBookmarkAction(actorObj, postObj);
            }

            this.userCooldowns[action.actorUsername] = Date.now();
            this.logger.log(`[Organic Queue Exec] ${logMsg}`);
          } catch (execErr) {
            this.logger.error(`Failed to execute queued action: ${execErr.message}`);
          }
        }

        // 2. Scan and schedule engagements for new posts created by real users
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const newPosts = await this.prisma.post.findMany({
          where: {
            createdAt: { gte: oneMinuteAgo },
            parentId: null
          },
          include: { author: true }
        });

        for (const post of newPosts) {
          if (!this.processedPostIds.has(post.id)) {
            this.processedPostIds.add(post.id);
            const isSimulated = post.author.email.endsWith('@intasela.internal');
            if (!isSimulated) {
              const niche = this.detectPostNiche(post.content);
              this.scheduleEngagementWindow(post, niche, post.author.username);
            }
          }
        }
      } catch (err) {
        this.logger.error('Error in queue processing loop:', err);
      }
    }, 15 * 1000);
  }

  private detectPostNiche(content: string): string {
    const text = content.toLowerCase();
    if (text.includes('sports') || text.includes('football') || text.includes('soccer') || text.includes('ball') || text.includes('goal')) return 'Sports';
    if (text.includes('politics') || text.includes('vote') || text.includes('election') || text.includes('government')) return 'Politics';
    if (text.includes('music') || text.includes('afrobeat') || text.includes('song') || text.includes('album')) return 'Music';
    if (text.includes('business') || text.includes('economy') || text.includes('invest') || text.includes('naira') || text.includes('stock')) return 'Business';
    if (text.includes('food') || text.includes('recipe') || text.includes('eat') || text.includes('chef') || text.includes('restaurant')) return 'Food';
    if (text.includes('fashion') || text.includes('wear') || text.includes('style') || text.includes('streetwear')) return 'Fashion';
    if (text.includes('study') || text.includes('scholarship') || text.includes('abroad') || text.includes('university') || text.includes('education')) return 'Education';
    if (text.includes('joke') || text.includes('meme') || text.includes('cruise') || text.includes('funny')) return 'Trending';
    return 'Hobbies';
  }

  private pushToQueue(postId: number, postAuthorId: string, actor: any, type: any, executeAtTimestamp: number, niche: string) {
    const actionId = Math.random().toString(36).substring(7);
    this.scheduledQueue.push({
      id: actionId,
      postId,
      postAuthorId,
      actorId: actor.id,
      actorUsername: actor.username,
      type,
      executeAt: new Date(executeAtTimestamp),
      niche
    });
  }

  private getUserPersonality(username: string): 'Heavy' | 'Reader' | 'Social' | 'Amplifier' | 'Quiet' {
    const heavy = ['chioma_tech', 'musa_crypto', 'ngozi_wellness', 'uche_technews', 'obinna_biz'];
    const readers = ['emeka_fitness', 'sarah_literature', 'joy_visuals', 'funmi_startup', 'dami_lifestyle'];
    const social = ['amina_cooks', 'tunde_marketing', 'dele_sports', 'grace_edu', 'kemi_afrobeats'];
    const amplifiers = ['chinyere_travels', 'kunle_gaming', 'segun_fashion', 'victor_photo', 'bassey_sports'];
    
    if (heavy.includes(username)) return 'Heavy';
    if (readers.includes(username)) return 'Reader';
    if (social.includes(username)) return 'Social';
    if (amplifiers.includes(username)) return 'Amplifier';
    return 'Quiet';
  }

  private getInterestMatchScore(actor: any, niche: string): number {
    let interests: string[] = [];
    if (actor.interests) {
      interests = Array.isArray(actor.interests) ? actor.interests : JSON.parse(actor.interests as string);
    }
    const lowerNiche = niche.toLowerCase();
    let matches = 0;
    for (const interest of interests) {
      const lowerInt = interest.toLowerCase();
      if (lowerInt.includes(lowerNiche) || lowerNiche.includes(lowerInt)) {
        matches++;
      }
      if (lowerNiche === 'sports' && (lowerInt.includes('football') || lowerInt.includes('sports') || lowerInt.includes('fitness'))) matches++;
      if (lowerNiche === 'politics' && (lowerInt.includes('politics') || lowerInt.includes('world news') || lowerInt.includes('economics'))) matches++;
      if (lowerNiche === 'entertainment' && (lowerInt.includes('movies') || lowerInt.includes('music') || lowerInt.includes('celebrity') || lowerInt.includes('gaming'))) matches++;
      if (lowerNiche === 'business' && (lowerInt.includes('investing') || lowerInt.includes('economy') || lowerInt.includes('entrepreneurship') || lowerInt.includes('startup'))) matches++;
    }
    return matches;
  }

  private getActionDelay(type: 'LIKE' | 'REPLY' | 'RESELA' | 'QUOTE' | 'BOOKMARK'): number {
    const roll = Math.random();
    let minutes = 0;
    
    if (type === 'LIKE') {
      if (roll < 0.40) {
        minutes = Math.random() * 10;
      } else if (roll < 0.75) {
        minutes = 10 + Math.random() * 15;
      } else {
        minutes = 25 + Math.random() * 35;
      }
    } else if (type === 'REPLY') {
      if (roll < 0.10) {
        minutes = Math.random() * 5;
      } else if (roll < 0.50) {
        minutes = 5 + Math.random() * 15;
      } else if (roll < 0.85) {
        minutes = 20 + Math.random() * 25;
      } else {
        minutes = 45 + Math.random() * 15;
      }
    } else if (type === 'RESELA' || type === 'QUOTE') {
      minutes = 15 + Math.random() * 25;
    } else if (type === 'BOOKMARK') {
      minutes = 2 + Math.random() * 56;
    }
    
    return minutes * 60 * 1000;
  }

  private scheduleEngagementWindow(post: any, niche: string, authorUsername: string) {
    const now = Date.now();
    const isNewsAuthor = this.newsUsers.some(u => u.username === authorUsername);
    const eligibleActors = this.normalUsers.filter(u => u.username !== authorUsername);
    
    if (eligibleActors.length === 0) return;

    const selectActors = (count: number, baseProb: number, weights: (actor: any) => number) => {
      const candidates = eligibleActors.map(actor => {
        let prob = baseProb + weights(actor);
        const matchScore = this.getInterestMatchScore(actor, niche);
        prob += matchScore * 0.3;
        return { actor, prob };
      });
      return candidates
        .sort((a, b) => b.prob - a.prob)
        .slice(0, count)
        .map(c => c.actor);
    };

    // 1. Likes (10 to 25 users)
    const targetLikesCount = 10 + Math.floor(Math.random() * 16);
    const likeActors = selectActors(targetLikesCount, 0.4, (actor) => {
      const p = this.getUserPersonality(actor.username);
      if (p === 'Social') return 0.2;
      if (p === 'Reader') return 0.2;
      if (p === 'Quiet') return -0.2;
      return 0;
    });
    for (const actor of likeActors) {
      this.pushToQueue(post.id, post.authorId, actor, 'LIKE', now + this.getActionDelay('LIKE'), niche);
    }

    // 2. Replies (2 to 6 users)
    const targetRepliesCount = 2 + Math.floor(Math.random() * 5);
    const replyActors = selectActors(targetRepliesCount, 0.1, (actor) => {
      const p = this.getUserPersonality(actor.username);
      if (p === 'Social') return 0.4;
      if (p === 'Quiet') return -0.1;
      if (p === 'Reader') return -0.1;
      return 0;
    });
    for (const actor of replyActors) {
      this.pushToQueue(post.id, post.authorId, actor, 'REPLY', now + this.getActionDelay('REPLY'), niche);
    }

    // 3. Reselas (1 to 4 users)
    const targetReselasCount = 1 + Math.floor(Math.random() * 4);
    const reselaActors = selectActors(targetReselasCount, 0.1, (actor) => {
      const p = this.getUserPersonality(actor.username);
      if (p === 'Amplifier') return 0.4;
      if (p === 'Quiet') return -0.1;
      return 0;
    });
    for (const actor of reselaActors) {
      this.pushToQueue(post.id, post.authorId, actor, 'RESELA', now + this.getActionDelay('RESELA'), niche);
    }

    // 4. Bookmarks (2 to 5 users)
    const targetBookmarksCount = 2 + Math.floor(Math.random() * 4);
    const bookmarkActors = selectActors(targetBookmarksCount, 0.1, (actor) => {
      const p = this.getUserPersonality(actor.username);
      if (p === 'Reader') return 0.3;
      if (p === 'Quiet') return -0.1;
      return 0;
    });
    for (const actor of bookmarkActors) {
      this.pushToQueue(post.id, post.authorId, actor, 'BOOKMARK', now + this.getActionDelay('BOOKMARK'), niche);
    }

    // 5. Resela with Note (Quote) - 5-10% chance
    if (Math.random() < 0.10) {
      const quoteActors = selectActors(1, 0.1, (actor) => {
        const p = this.getUserPersonality(actor.username);
        if (p === 'Amplifier') return 0.4;
        return 0;
      });
      if (quoteActors.length > 0) {
        const actor = quoteActors[0];
        this.pushToQueue(post.id, post.authorId, actor, 'QUOTE', now + this.getActionDelay('QUOTE'), niche);
      }
    }

    // 6. News Pages Likes / Bookmarks on relevant user posts
    if (!isNewsAuthor) {
      for (const newsUser of this.newsUsers) {
        const matchScore = this.getInterestMatchScore(newsUser, niche);
        if (matchScore > 0 && Math.random() < 0.4) {
          this.pushToQueue(post.id, post.authorId, newsUser, 'LIKE', now + this.getActionDelay('LIKE'), niche);
          if (Math.random() < 0.3) {
            this.pushToQueue(post.id, post.authorId, newsUser, 'BOOKMARK', now + this.getActionDelay('BOOKMARK'), niche);
          }
        }
      }
    }

    this.logger.log(`[Organic Engine] Scheduled ${likeActors.length} Likes, ${replyActors.length} Replies, ${reselaActors.length} ReSelas, ${bookmarkActors.length} Bookmarks for Post #${post.id} (Niche: ${niche}) over the next 60 minutes.`);
  }

  private async loadMockPosts() {
    try {
      const filePath = path.join(__dirname, 'data', 'mock-posts.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        this.mockPostsData = JSON.parse(raw);
        this.logger.log('Successfully loaded mock-posts.json fallback data.');
      } else {
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

  async triggerSimulationOnDemand(): Promise<string> {
    this.logger.log('Manual simulator trigger received.');
    return await this.runSimulationTick();
  }

  private async runSimulationTick(): Promise<string> {
    if (this.normalUsers.length === 0) {
      await this.loadUsersList();
    }
    if (this.normalUsers.length === 0) {
      return 'No simulated users loaded yet.';
    }
    const user = this.normalUsers[Math.floor(Math.random() * this.normalUsers.length)];
    const log = await this.executePostAction(user, false);
    return `Manual tick triggered: ${log}`;
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

    // Schedule the 60-minute organic engagement window
    this.scheduleEngagementWindow(post, niche, user.username);

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
          'naijanews360': { query: 'Nigeria "breaking news" OR "societal happenings" OR "national news"', nicheDef: 'General Nigerian News & Breaking Updates' },
          'goal_nigeria': { query: 'football OR soccer OR "Super Eagles" OR "Premier League" Nigeria', nicheDef: 'Football (Soccer) & Sports updates' },
          'celeb_gossip': { query: 'Nollywood OR "celebrity gossip" OR "pop culture" Nigeria', nicheDef: 'Entertainment, Nollywood, & Celebrity Gossip' },
          'politics_nigeria': { query: 'politics OR election OR government OR policy Nigeria', nicheDef: 'Nigerian Politics, Government, & Elections' },
          'cruise_nation': { query: 'trending OR viral OR comedy OR memes Nigeria', nicheDef: 'Humor, Memes, & Viral Internet Trends' },
          'afrobeat_news': { query: 'Afrobeats OR music OR concert OR album Nigeria', nicheDef: 'Nigerian Music Industry & Afrobeats' },
          'food_daily': { query: 'food OR recipe OR restaurant OR cuisine Nigeria', nicheDef: 'Culinary Arts & Nigerian Cuisine' },
          'business_news': { query: 'finance OR economy OR startup OR investment OR stock Nigeria', nicheDef: 'Finance, Startups, & Nigerian Economy' },
          'trending_daily': { query: 'trending OR viral OR controversy OR hot topic Nigeria', nicheDef: 'Viral Internet Culture & Hot Topics' },
          'scholarship_shop': { query: 'scholarship OR "study abroad" OR "career advice" OR "job vacancy" Nigeria', nicheDef: 'Education, Career Opportunities, & Scholarships' }
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

You just found this recent headline: "${headline.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'")}"

Write a short post (under 280 characters) for your followers.
Rules:
1. First, check if the headline matches your niche focus. For example, if you are @scholarship_shop, the headline MUST be about education, careers, or scholarships. If it is about oil refineries, football matches, Nollywood gossip, or political elections, IT DOES NOT MATCH.
2. If the headline matches your niche, write an engaging post summarizing or reporting it. Use a fresh update format ("Breaking:", "JUST IN:", etc.).
3. If the headline is completely unrelated to your niche focus, DISCARD it! Instead, write an original, high-quality, practical advice post, tip, resource, or discussion question directly matching your niche focus.
4. Speak strictly in the tone designated by your Personality Guide and your niche focus.
5. DO NOT use hashtags.
6. DO NOT include any links or URLs. Just post the text.
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
