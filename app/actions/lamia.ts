"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"

// --- STORES ---

export async function getLamiaStores() {
    try {
        const stores = await prisma.lamiaStore.findMany({
            orderBy: { name: "asc" }
        })
        return { success: true, data: stores }
    } catch (error) {
        console.error("Failed to fetch stores:", error)
        return { success: false, error: "Failed to fetch stores" }
    }
}

export async function createLamiaStore(name: string) {
    try {
        const store = await prisma.lamiaStore.create({
            data: { name: name.trim() }
        })
        revalidatePath("/dashboard/lamiaferis/income")
        return { success: true, data: store }
    } catch (error) {
        console.error("Failed to create store:", error)
        return { success: false, error: "Failed to create store" }
    }
}

export async function updateLamiaStore(id: string, name: string) {
    try {
        const store = await prisma.lamiaStore.update({
            where: { id },
            data: { name: name.trim() }
        })
        revalidatePath("/dashboard/lamiaferis/income")
        return { success: true, data: store }
    } catch (error) {
        return { success: false, error: "Failed to update store" }
    }
}

export async function deleteLamiaStore(id: string) {
    try {
        await prisma.lamiaStore.delete({ where: { id } })
        revalidatePath("/dashboard/lamiaferis/income")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to delete store" }
    }
}

// --- COMMISSION RATES ---

export async function getCommissionRates() {
    try {
        const rates = await prisma.commissionRate.findMany({
            orderBy: { rate: "asc" }
        })
        return { success: true, data: rates }
    } catch (error) {
        console.error("Failed to fetch rates:", error)
        return { success: false, error: "Failed to fetch rates" }
    }
}

export async function createCommissionRate(rate: number, label: string) {
    try {
        const newRate = await prisma.commissionRate.create({
            data: {
                rate,
                label: label.trim()
            }
        })
        revalidatePath("/dashboard/lamiaferis/income")
        return { success: true, data: newRate }
    } catch (error) {
        console.error("Failed to create rate:", error)
        return { success: false, error: "Failed to create rate" }
    }
}

export async function updateCommissionRate(id: string, rate: number, label: string) {
    try {
        const updatedRate = await prisma.commissionRate.update({
            where: { id },
            data: { rate, label: label.trim() }
        })
        revalidatePath("/dashboard/lamiaferis/income")
        return { success: true, data: updatedRate }
    } catch (error) {
        return { success: false, error: "Failed to update rate" }
    }
}

export async function deleteCommissionRate(id: string) {
    try {
        await prisma.commissionRate.delete({ where: { id } })
        revalidatePath("/dashboard/lamiaferis/income")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to delete rate" }
    }
}

// --- POS TRANSACTIONS ---

export async function getPosTransactions() {
    try {
        const transactions = await prisma.posTransaction.findMany({
            orderBy: { date: "desc" },
            include: {
                store: true,
                commissionRate: true
            }
        })
        return { success: true, data: transactions }
    } catch (error) {
        console.error("Failed to fetch POS transactions:", error)
        return { success: false, error: "Failed to fetch POS transactions" }
    }
}

export async function createPosTransaction(data: {
    date: Date;
    storeId: string;
    amount: number;
    commissionRateId: string;
    note?: string;
}) {
    try {
        // Fetch commission rate to snapshot it
        const rate = await prisma.commissionRate.findUnique({
            where: { id: data.commissionRateId }
        })

        if (!rate) {
            return { success: false, error: "Commission rate not found" }
        }

        // Calculate NET: Amount / (1 + Rate / 100)
        // User enters rate as 3.0825 which means 3.0825%
        const net = data.amount / (1 + rate.rate / 100);
        const commissionAmount = data.amount - net;

        const transaction = await prisma.posTransaction.create({
            data: {
                date: data.date,
                storeId: data.storeId,
                amount: data.amount,
                commissionRateId: data.commissionRateId,
                commissionRateSnapshot: rate.rate,
                net: net,
                note: data.note
            }
        })
        revalidatePath("/dashboard/lamiaferis/income")
        return { success: true, data: transaction }
    } catch (error) {
        console.error("Failed to create POS transaction:", error)
        return { success: false, error: "Failed to create POS transaction" }
    }
}

export async function updatePosTransaction(id: string, data: {
    date: Date;
    storeId: string;
    amount: number;
    commissionRateId: string;
    note?: string;
}) {
    try {
        const rate = await prisma.commissionRate.findUnique({
            where: { id: data.commissionRateId }
        })

        if (!rate) {
            return { success: false, error: "Commission rate not found" }
        }

        const net = data.amount / (1 + rate.rate / 100);
        const commissionAmount = data.amount - net;

        const transaction = await prisma.posTransaction.update({
            where: { id },
            data: {
                date: data.date,
                storeId: data.storeId,
                amount: data.amount,
                commissionRateId: data.commissionRateId,
                commissionRateSnapshot: rate.rate,
                net: net,
                note: data.note
            }
        })
        revalidatePath("/dashboard/lamiaferis/income")
        return { success: true, data: transaction }
    } catch (error) {
        console.error("Failed to update POS transaction:", error)
        return { success: false, error: "Failed to update POS transaction" }
    }
}

export async function deletePosTransaction(id: string) {
    try {
        await prisma.posTransaction.delete({ where: { id } })
        revalidatePath("/dashboard/lamiaferis/income")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to delete transaction" }
    }
}

// --- CASH TRANSACTIONS ---

export async function getCashTransactions() {
    try {
        const transactions = await prisma.cashTransaction.findMany({
            orderBy: { date: "desc" },
            include: {
                store: true
            }
        })
        return { success: true, data: transactions }
    } catch (error) {
        return { success: false, error: "Failed to fetch cash transactions" }
    }
}

export async function createCashTransaction(data: { date: Date; amount: number; storeId: string; note?: string }) {
    try {
        const transaction = await prisma.cashTransaction.create({
            data: {
                date: data.date,
                amount: data.amount,
                storeId: data.storeId,
                note: data.note
            }
        })
        revalidatePath("/dashboard/lamiaferis/income")
        return { success: true, data: transaction }
    } catch (error) {
        console.error("Create Cash Transaction Error:", error)
        return { success: false, error: "Failed to create cash transaction" }
    }
}

export async function updateCashTransaction(id: string, data: { date: Date; amount: number; storeId: string; note?: string }) {
    try {
        const transaction = await prisma.cashTransaction.update({
            where: { id },
            data: {
                date: data.date,
                amount: data.amount,
                storeId: data.storeId,
                note: data.note
            }
        })
        revalidatePath("/dashboard/lamiaferis/income")
        return { success: true, data: transaction }
    } catch (error) {
        console.error("Update Cash Transaction Error:", error)
        return { success: false, error: "Failed to update cash transaction" }
    }
}

export async function deleteCashTransaction(id: string) {
    try {
        await prisma.cashTransaction.delete({ where: { id } })
        revalidatePath("/dashboard/lamiaferis/income")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to delete cash transaction" }
    }
}
