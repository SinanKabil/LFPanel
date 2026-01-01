"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// In a real app, strict session management is needed. 
// For this single-user panel, we will store a simple cookie.

import { prisma } from "@/lib/prisma"

export async function loginAction(password: string, brand?: string) {
    // Determine target brand key
    // If brand is not provided (legacy), maybe try both or fail?
    // The UI now sends brand.

    let dbPassword = process.env.ADMIN_PASSWORD || "Sinan123" // Default fallback

    if (brand) {
        try {
            const configParams = await prisma.appConfig.findUnique({
                where: { key: `PASSWORD_${brand}` }
            })
            if (configParams) {
                dbPassword = configParams.value
            }
        } catch (error) {
            console.error("Failed to fetch password from DB, using fallback:", error)
            // Fallback to env/default is already set in dbPassword
        }
    }

    if (password.trim() === dbPassword.trim()) {
        // Set cookie, could differentiate session if needed but single admin is fine
        (await cookies()).set("auth_session", "true", { httpOnly: true, path: "/" })
        return { success: true }
    }

    return { success: false, error: "Hatalı şifre" }
}

export async function logoutAction() {
    (await cookies()).delete("auth_session")
    redirect("/")
}
