"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function approveWithdrawal(transactionId: number) {
  try {
    const tx = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!tx || tx.type !== "WITHDRAWAL") {
      return { success: false, error: "Invalid transaction." };
    }

    if (tx.status !== "PENDING") {
      return { success: false, error: "Transaction is not pending." };
    }

    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "COMPLETED" }
    });

    revalidatePath("/creator/withdrawals");
    return { success: true };
  } catch (error: any) {
    console.error("Error approving withdrawal:", error);
    return { success: false, error: "Failed to approve withdrawal." };
  }
}

export async function rejectWithdrawal(transactionId: number) {
  try {
    const tx = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!tx || tx.type !== "WITHDRAWAL") {
      return { success: false, error: "Invalid transaction." };
    }

    if (tx.status !== "PENDING") {
      return { success: false, error: "Transaction is not pending." };
    }

    // Wrap in a transaction to ensure both status update and refund happen together safely
    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transactionId },
        data: { status: "REJECTED" }
      }),
      prisma.user.update({
        where: { id: tx.userId },
        data: {
          walletBalance: {
            increment: tx.amount // Refund the amount back to their wallet
          }
        }
      })
    ]);

    revalidatePath("/creator/withdrawals");
    return { success: true };
  } catch (error: any) {
    console.error("Error rejecting withdrawal:", error);
    return { success: false, error: "Failed to reject withdrawal." };
  }
}
