"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"

// --- SALES ACTIONS ---

export async function getSales(brand: string) {
    // currently we don't store brand in Sale model separate from Store enum, 
    // but "RadiantJewelry Gift" and "The Trendy Outfitters" are Etsy stores.
    // We should filter by store if needed, or if "Lamiaferis" is a separate store.
    // The Prompt says: "Mağaza: RadiantJewelry Gift ve The Trendy Outfitters mağazalarım seçenek olarak sunulmalı." for Etsy panel.
    // So all sales here are for Etsy panel.
    try {
        const sales = await prisma.sale.findMany({
            include: { product: true },
            orderBy: { date: "desc" },
        })
        return { success: true, data: sales }
    } catch (error) {
        console.error(error)
        return { success: false, error: "Failed to fetch sales" }
    }
}

export type SaleFormData = {
    store: "RADIANT_JEWELRY_GIFT" | "THE_TRENDY_OUTFITTERS" | "LAMIAFERIS"
    type: "ORGANIC" | "GIVEAWAY" | "SALE"
    productId: string
    quantity: number
    date: Date
    orderNo: string
    buyerPaid: number
    feesCredits: number
    totalSalePriceTL: number
    productCost: number
    shippingCost: number
    discountRate?: number
}

function calculateProfit(data: SaleFormData) {
    // Logic: 
    // Kar USD = (Buyer Paid - Fees Credits) - Ürün Maliyeti - Kargo Maliyeti
    // Exchange Rate = Toplam Satış Fiyatı TL / Buyer Paid
    // Kar TL = Kar USD * Exchange Rate

    const profitUSD = (data.buyerPaid - data.feesCredits) - data.productCost - data.shippingCost

    // Avoid division by zero
    let exchangeRate = 0
    if (data.buyerPaid > 0) {
        exchangeRate = data.totalSalePriceTL / data.buyerPaid
    }

    const profitTL = profitUSD * exchangeRate

    return { profitUSD, profitTL }
}

export async function createSale(data: SaleFormData) {
    try {
        const { profitUSD, profitTL } = calculateProfit(data)

        await prisma.sale.create({
            data: {
                store: data.store,
                type: data.type,
                productId: data.productId,
                quantity: data.quantity,
                date: data.date,
                orderNo: data.orderNo,
                buyerPaid: data.buyerPaid,
                feesCredits: data.feesCredits,
                totalSalePriceTL: data.totalSalePriceTL,
                productCost: data.productCost,
                shippingCost: data.shippingCost,
                profitUSD,
                profitTL,
                discountRate: data.discountRate,
            },
        })
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        console.error("Create Sale Error:", error)
        return { success: false, error: "Failed to create sale" }
    }
}

export async function updateSale(id: string, data: SaleFormData) {
    try {
        const { profitUSD, profitTL } = calculateProfit(data)

        await prisma.sale.update({
            where: { id },
            data: {
                store: data.store,
                type: data.type,
                productId: data.productId,
                quantity: data.quantity,
                date: data.date,
                orderNo: data.orderNo,
                buyerPaid: data.buyerPaid,
                feesCredits: data.feesCredits,
                totalSalePriceTL: data.totalSalePriceTL,
                productCost: data.productCost,
                shippingCost: data.shippingCost,
                profitUSD,
                profitTL,
                discountRate: data.discountRate,
            },
        })
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        console.error("Update Sale Error:", error)
        return { success: false, error: "Failed to update sale" }
    }
}


export async function deleteSale(id: string) {
    try {
        await prisma.sale.delete({ where: { id } })
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to delete sale" }
    }
}
