"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"

// --- EXPENSES ACTIONS ---

import { Store } from "@prisma/client"

export async function getExpenses(store?: Store | "etsy") {
    try {
        let where: any = {}
        if (store === "etsy") {
            where = {
                store: {
                    in: [Store.RADIANT_JEWELRY_GIFT, Store.THE_TRENDY_OUTFITTERS]
                }
            }
        } else if (store) {
            where = { store }
        }

        const expenses = await prisma.expense.findMany({
            where,
            orderBy: { date: "desc" },
        })
        return { success: true, data: expenses }
    } catch (error) {
        return { success: false, error: "Failed to fetch expenses" }
    }
}



// ...

export type ExpenseFormData = {
    date: Date
    category: string
    store: Store
    amountTL?: number | null
    amountUSD?: number | null
    exchangeRate?: number | null
    description?: string
}

export async function createExpense(data: ExpenseFormData) {
    try {
        // Validation: At least one amount must be greater than 0
        const hasTL = data.amountTL !== undefined && data.amountTL !== null && data.amountTL > 0
        const hasUSD = data.amountUSD !== undefined && data.amountUSD !== null && data.amountUSD > 0

        if (!hasTL && !hasUSD) {
            return { success: false, error: "Amount is required (TL or USD)" }
        }

        await prisma.expense.create({
            data: {
                date: data.date,
                category: data.category,
                store: data.store,
                amountTL: data.amountTL || null,
                amountUSD: data.amountUSD || null,
                exchangeRate: data.exchangeRate || null,
                description: data.description,
            },
        })
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error: any) {
        console.error("Create Expense Error:", error)
        return { success: false, error: error.message || "Failed to create expense" }
    }
}

export async function updateExpense(id: string, data: ExpenseFormData) {
    try {
        const hasTL = data.amountTL !== undefined && data.amountTL !== null && data.amountTL > 0
        const hasUSD = data.amountUSD !== undefined && data.amountUSD !== null && data.amountUSD > 0

        if (!hasTL && !hasUSD) {
            return { success: false, error: "Amount is required (TL or USD)" }
        }

        await prisma.expense.update({
            where: { id },
            data: {
                date: data.date,
                category: data.category,
                store: data.store,
                amountTL: data.amountTL || null,
                amountUSD: data.amountUSD || null,
                exchangeRate: data.exchangeRate || null,
                description: data.description,
            },
        })
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to update expense" }
    }
}

// --- CATEGORY ACTIONS ---

export async function getExpenseCategories(type: "ETSY" | "LAMIAFERIS" = "ETSY") {
    try {
        // 1. Get defined categories by type
        const definedCategories = await prisma.expenseCategory.findMany({
            where: { type },
            orderBy: { name: "asc" },
        })

        // 2. We skip self-healing for now or adapt it. 
        // If we want self-healing, we need to know the type of existing expenses, but Expense model doesn't have type.
        // It has Store. Store implies type.

        // Let's rely on defined categories for now to ensure strict separation as requested.
        return { success: true, data: definedCategories }
    } catch (error) {
        console.error("Get Categories Error:", error)
        return { success: false, error: "Failed to fetch categories" }
    }
}

export async function createExpenseCategory(name: string, type: "ETSY" | "LAMIAFERIS" = "ETSY") {
    try {
        const existing = await prisma.expenseCategory.findUnique({
            where: {
                name_type: {
                    name: name,
                    type: type
                }
            }
        })
        if (existing) {
            return { success: false, error: "Category already exists" }
        }
        const category = await prisma.expenseCategory.create({
            data: { name, type },
        })
        revalidatePath("/dashboard")
        return { success: true, data: category }
    } catch (error) {
        console.error(error)
        return { success: false, error: "Failed to create category" }
    }
}

export async function updateExpenseCategory(id: string, name: string) {
    try {
        // We need to check uniqueness again but we don't know the type easily without fetching.
        // For simplicity, let's just update and let Prisma throw if unique constraint fails.
        await prisma.expenseCategory.update({
            where: { id },
            data: { name },
        })
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to update category" }
    }
}

export async function deleteExpenseCategory(id: string) {
    try {
        await prisma.expenseCategory.delete({ where: { id } })
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to delete category" }
    }
}

export async function deleteExpense(id: string) {
    try {
        await prisma.expense.delete({ where: { id } })
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to delete expense" }
    }
}
