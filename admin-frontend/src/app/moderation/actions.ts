"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deletePost(postId: number) {
  try {
    await prisma.post.delete({
      where: { id: postId },
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

export async function togglePostFlag(postId: number, isFlagged: boolean) {
  try {
    await prisma.post.update({
      where: { id: postId },
      data: { isFlagged },
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

export async function togglePostEligibility(postId: number, isEligible: boolean) {
  try {
    await prisma.post.update({
      where: { id: postId },
      data: { isEligible },
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
