"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMonetizationRates() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'monetization_rates' }
    });

    if (setting && setting.value) {
      const value = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
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
    await prisma.systemSetting.upsert({
      where: { key: 'monetization_rates' },
      update: { value: rates as any },
      create: { key: 'monetization_rates', value: rates as any },
    });

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
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'monetization_rules' }
    });

    if (setting && setting.value) {
      const value = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
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
    await prisma.systemSetting.upsert({
      where: { key: 'monetization_rules' },
      update: { value: rules as any },
      create: { key: 'monetization_rules', value: rules as any },
    });

    revalidatePath("/creator/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating monetization rules:", error);
    return { success: false, error: "Failed to update rules." };
  }
}
