"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";

export async function assignUserRole(userId: string, roleId: string | null, reason: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    await prisma.user.update({
      where: { id: userId },
      data: { roleId },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "UPDATE",
        resourceType: "/users/role",
        requestPayload: { userId, roleId, reason },
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
