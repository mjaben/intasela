import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';

const INTERESTS_POOL = [
  "Movies & TV", "Music", "Books & Literature", "Theater & Performing Arts", "Visual Arts & Design",
  "Entrepreneurship", "Investing & Stocks", "Marketing & Advertising", "Small Business", "Economics", "Cryptocurrency & Blockchain",
  "Job Searching & Careers", "Higher Education", "Online Learning", "Professional Development",
  "Parenting", "Family Activities",
  "Cooking & Recipes", "Restaurants", "Healthy Eating & Nutrition", "Coffee & Tea",
  "Fitness & Exercise", "Mental Health", "Yoga & Meditation",
  "Gaming", "Video Games", "Esports", "Photography", "Gardening", "DIY & Crafts", "Travel", "Pets & Animals",
  "World News", "Technology News", "Science News", "Politics News",
  "Gadgets & Consumer Tech", "Artificial Intelligence", "Space & Astronomy", "Environment & Climate", "Programming & Software",
  "Football (Soccer)", "Basketball", "Tennis", "Motorsports",
  "Men's Fashion", "Women's Fashion", "Beauty & Makeup", "Streetwear",
  "Destinations", "Adventure Travel", "Luxury Travel"
];

const SIMULATED_PROFILES = [
  { firstName: "Chioma", lastName: "Adebayo", username: "chioma_tech", bio: "Software Engineer & Tech enthusiast. Building scalable web apps. Coding lover. 💻🍳", gender: "FEMALE", occupation: "Software Engineer", country: "Nigeria", state: "Lagos", nicheInterests: ["Programming & Software", "Artificial Intelligence", "Gadgets & Consumer Tech", "Online Learning"] },
  { firstName: "Babajide", lastName: "Sowore", username: "jide_invest", bio: "Angel investor, market analyst, and entrepreneur. Sharing thoughts on stocks, crypto, and Nigerian economy. 📈🇳🇬", gender: "MALE", occupation: "Investor", country: "Nigeria", state: "Lagos", nicheInterests: ["Investing & Stocks", "Cryptocurrency & Blockchain", "Entrepreneurship", "Economics"] },
  { firstName: "Amina", lastName: "Yusuf", username: "amina_cooks", bio: "Food blogger & Chef. Sharing recipes, restaurant reviews, and healthy eating tips. 🍲🍰", gender: "FEMALE", occupation: "Chef", country: "Nigeria", state: "FCT", nicheInterests: ["Cooking & Recipes", "Restaurants", "Healthy Eating & Nutrition", "Coffee & Tea"] },
  { firstName: "Emeka", lastName: "Okafor", username: "emeka_fitness", bio: "Certified fitness trainer, gym rat, and health coach. Let's build healthy habits together! 💪🏃‍♂️", gender: "MALE", occupation: "Fitness Coach", country: "Nigeria", state: "Enugu", nicheInterests: ["Fitness & Exercise", "Healthy Eating & Nutrition", "Yoga & Meditation", "Mental Health"] },
  { firstName: "Tunde", lastName: "Alabi", username: "tunde_marketing", bio: "Digital marketer & brand strategist. Helping small businesses scale. Growth hacker. 🚀📢", gender: "MALE", occupation: "Marketer", country: "Nigeria", state: "Oyo", nicheInterests: ["Marketing & Advertising", "Entrepreneurship", "Small Business", "Professional Development"] },
  { firstName: "Chinyere", lastName: "Nwosu", username: "chinyere_travels", bio: "Adventure traveler, photographer, and storyteller. Exploring Nigeria & beyond, one destination at a time. 🗺️📸", gender: "FEMALE", occupation: "Travel Creator", country: "Nigeria", state: "Rivers", nicheInterests: ["Travel", "Destinations", "Adventure Travel", "Photography"] },
  { firstName: "Abubakar", lastName: "Musa", username: "musa_crypto", bio: "Web3 builder & Blockchain analyst. Crypto enthusiast, developer, and educator. ⛓️🪙", gender: "MALE", occupation: "Web3 Developer", country: "Nigeria", state: "Kano", nicheInterests: ["Cryptocurrency & Blockchain", "Investing & Stocks", "Programming & Software", "Technology News"] },
  { firstName: "Sarah", lastName: "Lawson", username: "sarah_literature", bio: "Book worm, writer, and literature lover. Reviewing African literature and sharing creative writing. 📚✍️", gender: "FEMALE", occupation: "Writer", country: "Nigeria", state: "Lagos", nicheInterests: ["Books & Literature", "Visual Arts & Design", "Online Learning", "Mental Health"] },
  { firstName: "Kunle", lastName: "Falade", username: "kunle_gaming", bio: "Pro gamer, esports caster, and tech reviewer. Live streaming, video games, and gadget reviews. 🎮🎧", gender: "MALE", occupation: "Gamer", country: "Nigeria", state: "Lagos", nicheInterests: ["Gaming", "Video Games", "Esports", "Gadgets & Consumer Tech"] },
  { firstName: "Fatima", lastName: "Bello", username: "fatima_parenting", bio: "Mother of two. Child education enthusiast. Sharing parenting tips, family activities, and motherhood. 🤱❤️", gender: "FEMALE", occupation: "Educator", country: "Nigeria", state: "Kaduna", nicheInterests: ["Parenting", "Family Activities", "Mental Health", "Healthy Eating & Nutrition"] },
  { firstName: "Segun", lastName: "Olatunji", username: "segun_fashion", bio: "Men's fashion designer, streetwear lover, and stylist. Redefining modern African style. 👔✨", gender: "MALE", occupation: "Fashion Designer", country: "Nigeria", state: "Lagos", nicheInterests: ["Men's Fashion", "Streetwear", "Visual Arts & Design", "Marketing & Advertising"] },
  { firstName: "Ngozi", lastName: "Eze", username: "ngozi_wellness", bio: "Mental health advocate & yoga practitioner. Mindful living, self-care, and wellness tips. 🧘‍♀️🌱", gender: "FEMALE", occupation: "Wellness Coach", country: "Nigeria", state: "Anambra", nicheInterests: ["Mental Health", "Yoga & Meditation", "Fitness & Exercise", "Healthy Eating & Nutrition"] },
  { firstName: "Dele", lastName: "Ojo", username: "dele_sports", bio: "Sports journalist, football fanatic, and Chelsea FC supporter. Match analysis, news, and banters. ⚽🎙️", gender: "MALE", occupation: "Sports Journalist", country: "Nigeria", state: "Lagos", nicheInterests: ["Football (Soccer)", "Sports News", "Basketball", "Motorsports"] },
  { firstName: "Joy", lastName: "Ibrahim", username: "joy_visuals", bio: "Visual artist, graphic designer, and UI/UX enthusiast. Creating beautiful digital experiences. 🎨🖌️", gender: "FEMALE", occupation: "Graphic Designer", country: "Nigeria", state: "FCT", nicheInterests: ["Visual Arts & Design", "Programming & Software", "Gadgets & Consumer Tech", "Photography"] },
  { firstName: "Yusuf", lastName: "Garba", username: "yusuf_agric", bio: "Agripreneur and gardening lover. Passionate about sustainable farming, organic food, and nature. 🌾🚜", gender: "MALE", occupation: "Farmer", country: "Nigeria", state: "Plateau", nicheInterests: ["Gardening", "Environment & Climate", "Healthy Eating & Nutrition", "Entrepreneurship"] },
  { firstName: "Funmi", lastName: "Coker", username: "funmi_startup", bio: "Founder & Small business advocate. Sharing tips on bootstrapping startups and professional growth. 💼🚀", gender: "FEMALE", occupation: "Founder", country: "Nigeria", state: "Lagos", nicheInterests: ["Entrepreneurship", "Small Business", "Marketing & Advertising", "Investing & Stocks"] },
  { firstName: "Uche", lastName: "Obi", username: "uche_technews", bio: "Tech journalist and consumer gadgets reviewer. Breaking news, product launches, and reviews. 📱📰", gender: "MALE", occupation: "Tech Journalist", country: "Nigeria", state: "Lagos", nicheInterests: ["Technology News", "Gadgets & Consumer Tech", "Artificial Intelligence", "Science News"] },
  { firstName: "Halima", lastName: "Danjuma", username: "halima_beauty", bio: "Beauty influencer & makeup artist. Sharing tutorials, reviews, and skincare routines. 💄✨", gender: "FEMALE", occupation: "Makeup Artist", country: "Nigeria", state: "FCT", nicheInterests: ["Beauty & Makeup", "Women's Fashion", "Visual Arts & Design", "Marketing & Advertising"] },
  { firstName: "Victor", lastName: "Johnson", username: "victor_photo", bio: "Street photographer, videographer, and visual storyteller. Capturing Nigerian city life. 📸🏙️", gender: "MALE", occupation: "Photographer", country: "Nigeria", state: "Lagos", nicheInterests: ["Photography", "Visual Arts & Design", "Travel", "Destinations"] },
  { firstName: "Grace", lastName: "Adeyemi", username: "grace_edu", bio: "Online learning enthusiast and professional development trainer. Helping you build career skills. 🎓✨", gender: "FEMALE", occupation: "Trainer", country: "Nigeria", state: "Oyo", nicheInterests: ["Online Learning", "Professional Development", "Job Searching & Careers", "Higher Education"] },
  // 10 News Users
  { firstName: "Naija", lastName: "News 360", username: "naijanews360", bio: "24/7 breaking news, politics, and top stories across Nigeria. 🇳🇬📰", gender: "OTHER", occupation: "News Publisher", country: "Nigeria", state: "Lagos", nicheInterests: ["News", "World News", "Politics News"] },
  { firstName: "Goal", lastName: "Nigeria", username: "goal_nigeria", bio: "Your home for football news, Super Eagles updates, and sports analysis. ⚽🇳🇬", gender: "OTHER", occupation: "Sports Publisher", country: "Nigeria", state: "Lagos", nicheInterests: ["Sports News", "Football (Soccer)", "News"] },
  { firstName: "Celeb", lastName: "Gossip", username: "celeb_gossip", bio: "Hot gist, celebrity updates, and the latest entertainment news in Nigeria. 🎬🔥", gender: "OTHER", occupation: "Entertainment Publisher", country: "Nigeria", state: "Lagos", nicheInterests: ["Entertainment", "Music", "Movies & TV", "News"] },
  { firstName: "Politics", lastName: "Nigeria", username: "politics_nigeria", bio: "Unbiased political news, analysis, and election updates in Nigeria. 🗳️📰", gender: "OTHER", occupation: "Politics Publisher", country: "Nigeria", state: "FCT", nicheInterests: ["Politics News", "World News", "News"] },
  { firstName: "Cruise", lastName: "Nation", username: "cruise_nation", bio: "Trending topics, memes, comedy, and pure cruise. 🤣🔥", gender: "OTHER", occupation: "Trending Publisher", country: "Nigeria", state: "Lagos", nicheInterests: ["Entertainment", "Comedy", "Trending"] },
  { firstName: "Afrobeat", lastName: "News", username: "afrobeat_news", bio: "The number 1 source for Afrobeats music, artists, and culture. 🎶🌍", gender: "OTHER", occupation: "Music Publisher", country: "Nigeria", state: "Lagos", nicheInterests: ["Music", "Entertainment", "News"] },
  { firstName: "Food", lastName: "Daily", username: "food_daily", bio: "Daily food inspiration, restaurant reviews, and Nigerian recipes. 🥘🍗", gender: "OTHER", occupation: "Food Publisher", country: "Nigeria", state: "Lagos", nicheInterests: ["Cooking & Recipes", "Restaurants", "Healthy Eating & Nutrition"] },
  { firstName: "Business", lastName: "News", username: "business_news", bio: "Economy, finance, startups, and business updates in Nigeria. 📈💼", gender: "OTHER", occupation: "Business Publisher", country: "Nigeria", state: "Lagos", nicheInterests: ["Economics", "Investing & Stocks", "Entrepreneurship", "News"] },
  { firstName: "Trending", lastName: "Daily", username: "trending_daily", bio: "What's happening right now? Trending stories and viral news. 🚀📲", gender: "OTHER", occupation: "Trending Publisher", country: "Nigeria", state: "Lagos", nicheInterests: ["News", "Trending", "World News"] },
  { firstName: "Scholarship", lastName: "Shop", username: "scholarship_shop", bio: "Your plug for scholarships, study abroad opportunities, and grants. 🎓✈️", gender: "OTHER", occupation: "Education Publisher", country: "Nigeria", state: "Lagos", nicheInterests: ["Higher Education", "Professional Development", "Online Learning"] }
];

export async function autoSeedSimulatorProfiles(prisma: any, logger: Logger) {
  try {
    const existingCount = await prisma.user.count({
      where: { email: { endsWith: '@intasela.internal' } }
    });

    if (existingCount >= 30) {
      logger.log('Simulated profiles already exist. Skipping auto-seed.');
      return;
    }

    logger.log(`Found ${existingCount} simulated profiles. Auto-seeding up to 30 profiles...`);
    const defaultPassword = "Password123!";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    for (const profile of SIMULATED_PROFILES) {
      const email = `${profile.username}@intasela.internal`;

      // Ensure up to 5 interests
      const interestsSet = new Set<string>(profile.nicheInterests);
      while (interestsSet.size < 5) {
        const randomInterest = INTERESTS_POOL[Math.floor(Math.random() * INTERESTS_POOL.length)];
        interestsSet.add(randomInterest);
      }
      const finalInterests = Array.from(interestsSet);

      const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${profile.username}`;

      await prisma.user.upsert({
        where: { email },
        update: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          username: profile.username,
          bio: profile.bio,
          gender: profile.gender,
          occupation: profile.occupation,
          country: profile.country,
          state: profile.state,
          creatorType: "SIMULATED_CREATOR",
          avatarUrl,
          interests: finalInterests,
          isActive: true,
          isSuspended: false
        },
        create: {
          email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          username: profile.username,
          password: hashedPassword,
          bio: profile.bio,
          gender: profile.gender,
          occupation: profile.occupation,
          country: profile.country,
          state: profile.state,
          creatorType: "SIMULATED_CREATOR",
          avatarUrl,
          interests: finalInterests,
          isActive: true,
          isShadowBanned: false,
          isSuspended: false
        }
      });
    }

    logger.log("Auto-seeding of simulated profiles completed successfully!");
  } catch (error) {
    logger.error("Auto-seeding failed:", error);
  }
}
