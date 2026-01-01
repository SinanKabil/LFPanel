"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

// --- PRODUCT ACTIONS ---

export async function getProducts() {
    try {
        const products = await prisma.product.findMany({
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                costUSD: true,
                imgUrl: true
            }
        })
        return { success: true, data: products }
    } catch (error) {
        console.error("Failed to fetch products:", error)
        return { success: false, error: "Failed to fetch products" }
    }
}

export async function createProduct(data: { name: string; costUSD: number; imgUrl?: string }) {
    try {
        await prisma.product.create({
            data: {
                name: data.name,
                costUSD: data.costUSD,
                imgUrl: data.imgUrl,
            },
        })
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to create product" }
    }
}

export async function updateProduct(id: string, data: { name: string; costUSD: number; imgUrl?: string }) {
    try {
        await prisma.product.update({
            where: { id },
            data: {
                name: data.name,
                costUSD: data.costUSD,
                imgUrl: data.imgUrl,
            },
        })
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to update product" }
    }
}

export async function deleteProduct(id: string) {
    try {
        await prisma.product.delete({
            where: { id },
        })
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to delete product" }
    }
}

// --- PASSWORD ACTIONS ---

export async function updatePassword(brand: string, password: string) {
    try {
        const key = `PASSWORD_${brand}`
        const cleanPassword = password.trim()

        await prisma.appConfig.upsert({
            where: { key },
            update: { value: cleanPassword },
            create: { key, value: cleanPassword }
        })

        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        console.error("Failed to update password:", error)
        return { success: false, error: "Failed to update password" }
    }
}

export async function getPasswords() {
    try {
        const configs = await prisma.appConfig.findMany({
            where: {
                key: { in: ["PASSWORD_ETSY", "PASSWORD_LAMIAFERIS"] }
            }
        })
        // Transform to easy object
        const passwords = {
            ETSY: configs.find(c => c.key === "PASSWORD_ETSY")?.value || "",
            LAMIAFERIS: configs.find(c => c.key === "PASSWORD_LAMIAFERIS")?.value || ""
        }
        return { success: true, data: passwords }
    } catch (error) {
        return { success: false, error: "Failed to fetch passwords" }
    }
}
