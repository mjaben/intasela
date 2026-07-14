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

  // Find user by email in SystemAdmin table
  const admin = await prisma.systemAdmin.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!admin || !admin.role || !admin.isActive) {
    return { error: "Invalid credentials or unauthorized access." };
  }

  // Verify password
  const isValid = await bcrypt.compare(password, admin.password);
  if (!isValid) {
    return { error: "Invalid credentials or unauthorized access." };
  }

  // Parse permissions from JSON array
  let permissions: string[] | null = null;
  if (admin.role.permissions) {
    try {
      const parsed = typeof admin.role.permissions === "string" 
        ? JSON.parse(admin.role.permissions) 
        : admin.role.permissions;
      if (Array.isArray(parsed)) {
        permissions = parsed as string[];
      }
    } catch(e) {
      console.error("Failed to parse permissions", e);
    }
  }

  // Create session
  await createSession(admin.id, admin.role.name, admin.firstName, permissions);

  // Redirect to dashboard
  redirect("/");
}
