"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

export async function deletePost(postId: number, reason: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    if (!hasPermission(user.permissions, "MODERATE_CONTENT", user.role)) {
      throw new Error("Missing permission: MODERATE_CONTENT");
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "DELETE",
        resourceType: "/moderation/post",
        requestPayload: { postId, reason },
        success: true
      }
    });

    revalidatePath("/moderation/selas");
    revalidatePath("/moderation/orbits");
    revalidatePath("/moderation/replies");
    return { success: true };
  } catch (error) {
    console.error("Error deleting post:", error);
    return { success: false, error: "Failed to delete content." };
  }
}

export async function togglePostFlag(postId: number, isFlagged: boolean, reason: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    if (!hasPermission(user.permissions, "MODERATE_CONTENT", user.role)) {
      throw new Error("Missing permission: MODERATE_CONTENT");
    }

    await prisma.post.update({
      where: { id: postId },
      data: { isFlagged },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "UPDATE",
        resourceType: "/moderation/post/flag",
        requestPayload: { postId, isFlagged, reason },
        success: true
      }
    });
    revalidatePath("/moderation/selas");
    revalidatePath("/moderation/orbits");
    revalidatePath("/moderation/replies");
    return { success: true };
  } catch (error) {
    console.error("Error toggling flag:", error);
    return { success: false, error: "Failed to update flag status." };
  }
}

export async function togglePostEligibility(postId: number, isEligible: boolean, reason: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    if (!hasPermission(user.permissions, "MODERATE_CONTENT", user.role)) {
      throw new Error("Missing permission: MODERATE_CONTENT");
    }

    await prisma.post.update({
      where: { id: postId },
      data: { isEligible },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "UPDATE",
        resourceType: "/moderation/post/eligibility",
        requestPayload: { postId, isEligible, reason },
        success: true
      }
    });
    revalidatePath("/moderation/selas");
    revalidatePath("/moderation/orbits");
    revalidatePath("/moderation/replies");
    return { success: true };
  } catch (error) {
    console.error("Error toggling eligibility:", error);
    return { success: false, error: "Failed to update eligibility status." };
  }
}
