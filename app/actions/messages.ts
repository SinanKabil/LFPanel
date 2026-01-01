"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"

// --- MESSAGES ACTIONS ---

export async function getMessages() {
    try {
        const messages = await prisma.message.findMany({
            orderBy: { createdAt: "desc" },
        })
        return { success: true, data: messages }
    } catch (error) {
        return { success: false, error: "Failed to fetch messages" }
    }
}

export async function createMessage(text: string) {
    try {
        await prisma.message.create({
            data: { text },
        })
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to create message" }
    }
}

export async function updateMessage(id: string, text: string) {
    try {
        await prisma.message.update({
            where: { id },
            data: { text },
        })
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to update message" }
    }
}

export async function deleteMessage(id: string) {
    try {
        await prisma.message.delete({ where: { id } })
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to delete message" }
    }
}
