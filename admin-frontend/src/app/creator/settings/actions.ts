"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMonetizationRates() {
  try {
    const settings: any[] = await prisma.$queryRaw`SELECT \`value\` FROM SystemSetting WHERE \`key\` = 'monetization_rates'`;

    if (settings && settings.length > 0) {
      const value = typeof settings[0].value === 'string' ? JSON.parse(settings[0].value) : settings[0].value;
      return value as { sela: number, resela: number, reply: number, viewRpm: number };
    }

    return { sela: 0, resela: 0, reply: 0, viewRpm: 0 };
  } catch (error) {
    console.error("Error fetching monetization rates:", error);
    return { sela: 0, resela: 0, reply: 0, viewRpm: 0 };
  }
}

export async function updateMonetizationRates(rates: { sela: number, resela: number, reply: number, viewRpm: number }) {
  try {
    const jsonStr = JSON.stringify(rates);
    
    await prisma.$executeRaw`
      INSERT INTO SystemSetting (\`key\`, \`value\`, \`updatedAt\`) 
      VALUES ('monetization_rates', ${jsonStr}, NOW(3))
      ON DUPLICATE KEY UPDATE \`value\` = ${jsonStr}, \`updatedAt\` = NOW(3)
    `;

    revalidatePath("/creator/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating monetization rates:", error);
    return { success: false, error: "Failed to update rates." };
  }
}

export type MonetizationRules = {
  bannedWords: string;
  minCharacterCount: number;
  preventDuplicates: boolean;
  preventSelfReward: boolean;
  echoChamberLimit: number;
  hourlyRewardLimit: number;
  minWithdrawalThreshold: number;
};

const defaultRules: MonetizationRules = {
  bannedWords: "",
  minCharacterCount: 15,
  preventDuplicates: true,
  preventSelfReward: true,
  echoChamberLimit: 5,
  hourlyRewardLimit: 10,
  minWithdrawalThreshold: 5000,
};

export async function getMonetizationRules() {
  try {
    const settings: any[] = await prisma.$queryRaw`SELECT \`value\` FROM SystemSetting WHERE \`key\` = 'monetization_rules'`;

    if (settings && settings.length > 0) {
      const value = typeof settings[0].value === 'string' ? JSON.parse(settings[0].value) : settings[0].value;
      return { ...defaultRules, ...value } as MonetizationRules;
    }

    return defaultRules;
  } catch (error) {
    console.error("Error fetching monetization rules:", error);
    return defaultRules;
  }
}

export async function updateMonetizationRules(rules: MonetizationRules) {
  try {
    const jsonStr = JSON.stringify(rules);
    
    await prisma.$executeRaw`
      INSERT INTO SystemSetting (\`key\`, \`value\`, \`updatedAt\`) 
      VALUES ('monetization_rules', ${jsonStr}, NOW(3))
      ON DUPLICATE KEY UPDATE \`value\` = ${jsonStr}, \`updatedAt\` = NOW(3)
    `;

    revalidatePath("/creator/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating monetization rules:", error);
    return { success: false, error: "Failed to update rules." };
  }
}
