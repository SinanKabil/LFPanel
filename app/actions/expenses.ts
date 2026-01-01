"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"

// --- EXPENSES ACTIONS ---

import { Store } from "@prisma/client"

export async function getExpenses(store?: Store) {
    try {
        const where = store ? { store } : {}
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
    amountTL?: number
    amountUSD?: number
    exchangeRate?: number
    description?: string
}

export async function createExpense(data: ExpenseFormData) {
    try {
        if (!data.amountTL && !data.amountUSD) {
            return { success: false, error: "Amount is required (TL or USD)" }
        }

        await prisma.expense.create({
            data: {
                date: data.date,
                category: data.category,
                store: data.store,
                amountTL: data.amountTL,
                amountUSD: data.amountUSD,
                exchangeRate: data.exchangeRate,
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
        if (!data.amountTL && !data.amountUSD) {
            return { success: false, error: "Amount is required (TL or USD)" }
        }

        await prisma.expense.update({
            where: { id },
            data: {
                date: data.date,
                category: data.category,
                store: data.store,
                amountTL: data.amountTL,
                amountUSD: data.amountUSD,
                exchangeRate: data.exchangeRate,
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

export async function getExpenseCategories() {
    try {
        const categories = await prisma.expenseCategory.findMany({
            orderBy: { name: "asc" },
        })
        return { success: true, data: categories }
    } catch (error) {
        return { success: false, error: "Failed to fetch categories" }
    }
}

export async function createExpenseCategory(name: string) {
    try {
        const existing = await prisma.expenseCategory.findUnique({
            where: { name },
        })
        if (existing) {
            return { success: false, error: "Category already exists" }
        }
        const category = await prisma.expenseCategory.create({
            data: { name },
        })
        revalidatePath("/dashboard")
        return { success: true, data: category }
    } catch (error) {
        return { success: false, error: "Failed to create category" }
    }
}

export async function updateExpenseCategory(id: string, name: string) {
    try {
        const existing = await prisma.expenseCategory.findUnique({
            where: { name },
        })
        if (existing && existing.id !== id) {
            return { success: false, error: "Category already exists" }
        }
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
