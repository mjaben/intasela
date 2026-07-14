"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

export async function inviteAdmin(data: any) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    if (!hasPermission(user.permissions, "MANAGE_SYSTEM", user.role)) {
      return { success: false, error: "Missing permission: MANAGE_SYSTEM" };
    }

    const { email, password, firstName, lastName, roleId } = data;

    const existingAdmin = await prisma.systemAdmin.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      return { success: false, error: "An admin with this email already exists." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await prisma.systemAdmin.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        roleId,
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "CREATE",
        resourceType: "/settings/team",
        requestPayload: { targetEmail: email, roleId },
        success: true
      }
    });

    revalidatePath("/settings/team");
    return { success: true };
  } catch (error) {
    console.error("Error inviting admin:", error);
    return { success: false, error: "Failed to invite admin." };
  }
}
