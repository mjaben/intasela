"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function assignUserRole(userId: string, roleId: string | null) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { roleId },
    });
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to assign role:", error);
    return { success: false, error: "Failed to assign role" };
  }
}
