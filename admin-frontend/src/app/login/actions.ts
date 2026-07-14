"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user || !user.role) {
    return { error: "Invalid credentials or unauthorized access." };
  }

  // Ensure they have an admin role
  if (!["super_admin", "admin", "moderator"].includes(user.role.name)) {
    return { error: "You do not have administrative privileges." };
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return { error: "Invalid credentials or unauthorized access." };
  }

  // Create session
  await createSession(user.id, user.role.name, user.firstName);

  // Redirect to dashboard
  redirect("/");
}
