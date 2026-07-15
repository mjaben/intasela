"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

const DEFAULT_SETTINGS = {
  maintenance_mode: false,
  allow_signups: true,
  enable_withdrawals: true,
  withdrawal_fee_percentage: 2.5,
  platform_fee_percentage: 10,
  platform_logo_url: "",
  support_email: "support@intasela.com",
  max_upload_size_mb: 50,
  auto_suspend_flag_threshold: 10,
};

export async function getSettings() {
  try {
    const settingsList = await prisma.systemSetting.findMany();
    const settingsMap = settingsList.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, any>);

    // Merge with defaults for any missing keys
    const mergedSettings = { ...DEFAULT_SETTINGS, ...settingsMap };
    return { success: true, data: mergedSettings };
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return { success: false, error: "Failed to fetch settings" };
  }
}

export async function updateSetting(key: string, value: any, reason: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    if (!hasPermission(user.permissions, "MANAGE_SYSTEM", user.role)) {
      throw new Error("Missing permission: MANAGE_SYSTEM");
    }

    if (!reason || reason.trim() === "") {
      throw new Error("Reason is required");
    }

    await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "UPDATE",
        resourceType: "/settings",
        requestPayload: { key, value, reason },
        success: true
      }
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to update setting ${key}:`, error);
    return { success: false, error: error.message || "Failed to update setting" };
  }
}
