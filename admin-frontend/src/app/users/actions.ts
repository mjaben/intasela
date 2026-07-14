"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

export async function assignUserRole(userId: string, isSpaceMod: boolean, reason: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    
    if (!hasPermission(user.permissions, "MANAGE_USERS", user.role)) {
      throw new Error("Missing permission: MANAGE_USERS");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isSpaceMod },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "UPDATE",
        resourceType: "/users/space_mod",
        requestPayload: { userId, isSpaceMod, reason },
        success: true
      }
    });
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to assign role:", error);
    return { success: false, error: "Failed to assign role" };
  }
}
