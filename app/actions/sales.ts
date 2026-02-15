"use server"

import { revalidatePath, revalidateTag } from "next/cache"
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
    tax: number
    totalSalePriceTL: number
    productCost: number
    shippingCost: number
    discountRate?: number
}

function calculateProfit(data: SaleFormData) {
    // Logic: 
    // Kar USD = (Buyer Paid - Vergi) - Fees - Ürün Maliyeti - Kargo Maliyeti
    // Exchange Rate = Toplam Satış Fiyatı TL / (Buyer Paid - Vergi)  <-- Should probably be based on Net Revenue?
    // Wait, Exchange Rate usually implies converting the Gross amount. 
    // "Total Sale Price TL" usually is the TL equivalent of the Buyer Paid (Gross).
    // If user inputs Buyer Paid (Gross) in USD and Total Sale Price TL (Gross) in TL, exchange rate is Gross/Gross.
    // If user inputs Net in one and Gross in other, it breaks.
    // User Instructions: "Vergi alanına girdiğim dolar tutarı Müşteri ödemesi ve kesintiler tutarlarından çıkarılarak tabloya yansımalı."
    // This is display logic. For PnL: "Hesaplama vergi tutarı çıkarıldıktan sonra yapılmalı."
    // Profit = (BuyerPaid - Tax) - Fees - ProductCost - ShippingCost.

    // Adjusted Profit Calculation based on User Request:
    // Profit = (BuyerPaid - Tax) - (Fees - Tax) - Costs 
    // This implies that the 'Fees' input includes the tax amount, and 'BuyerPaid' also includes it.

    // Net Revenue = BuyerPaid - Tax
    const netRevenue = data.buyerPaid - (data.tax || 0)

    // Actual Fees = FeesCredits - Tax
    // If tax is included in the fee amount shown on Etsy/Platform, we remove it to get the real fee expense.
    const actualFees = data.feesCredits - (data.tax || 0)

    const profitUSD = netRevenue - actualFees - data.productCost - data.shippingCost

    // Avoid division by zero
    let exchangeRate = 0
    // Use BuyerPaid (Gross) for rate calculation as it represents the transaction volume
    if (data.buyerPaid > 0) {
        exchangeRate = data.totalSalePriceTL / data.buyerPaid
    }

    const profitTL = profitUSD * exchangeRate

    return { profitUSD, profitTL }
}

export async function createSale(data: SaleFormData) {
    try {
        // Check for existing Order No
        if (data.orderNo) {
            const existing = await prisma.sale.findFirst({
                where: { orderNo: data.orderNo }
            })
            if (existing) {
                return { success: false, error: "Bu Sipariş Numarası zaten kullanımda!" }
            }
        }

        // Ensure numbers (handle empty strings or undefined)
        const safeData = {
            ...data,
            buyerPaid: Number(data.buyerPaid) || 0,
            feesCredits: Number(data.feesCredits) || 0,
            tax: Number(data.tax) || 0,
            productCost: Number(data.productCost) || 0,
            shippingCost: Number(data.shippingCost) || 0,
            totalSalePriceTL: Number(data.totalSalePriceTL) || 0,
        }

        const { profitUSD, profitTL } = calculateProfit(safeData)

        await prisma.sale.create({
            data: {
                store: data.store,
                type: data.type,
                productId: data.productId,
                quantity: data.quantity,
                date: data.date,
                orderNo: data.orderNo,
                buyerPaid: safeData.buyerPaid,
                feesCredits: safeData.feesCredits,
                tax: safeData.tax,
                totalSalePriceTL: safeData.totalSalePriceTL,
                productCost: safeData.productCost,
                shippingCost: safeData.shippingCost,
                profitUSD,
                profitTL,
                discountRate: data.discountRate,
            },
        })
        revalidatePath("/dashboard")
        // @ts-expect-error - Next.js version mismatch
        revalidateTag("analysis")
        return { success: true }
    } catch (error) {
        console.error("Create Sale Error:", error)
        return { success: false, error: "Failed to create sale" }
    }
}

export async function updateSale(id: string, data: SaleFormData) {
    try {
        console.log("Updating Sale:", id, data) // Log incoming data

        // Check for existing Order No (excluding current sale)
        if (data.orderNo) {
            const existing = await prisma.sale.findFirst({
                where: {
                    orderNo: data.orderNo,
                    NOT: { id }
                }
            })
            if (existing) {
                return { success: false, error: "Bu Sipariş Numarası zaten kullanımda!" }
            }
        }

        // Ensure numbers
        const safeData = {
            ...data,
            buyerPaid: Number(data.buyerPaid) || 0,
            feesCredits: Number(data.feesCredits) || 0,
            tax: Number(data.tax) || 0,
            productCost: Number(data.productCost) || 0,
            shippingCost: Number(data.shippingCost) || 0,
            totalSalePriceTL: Number(data.totalSalePriceTL) || 0,
        }

        const { profitUSD, profitTL } = calculateProfit(safeData)
        console.log("Calculated Profit:", profitUSD, profitTL)

        await prisma.sale.update({
            where: { id },
            data: {
                store: data.store,
                type: data.type,
                productId: data.productId,
                quantity: data.quantity,
                date: data.date,
                orderNo: data.orderNo,
                buyerPaid: safeData.buyerPaid,
                feesCredits: safeData.feesCredits,
                tax: safeData.tax,
                totalSalePriceTL: safeData.totalSalePriceTL,
                productCost: safeData.productCost,
                shippingCost: safeData.shippingCost,
                profitUSD,
                profitTL,
                discountRate: data.discountRate,
            },
        })
        revalidatePath("/dashboard")
        // @ts-expect-error - Next.js version mismatch
        revalidateTag("analysis")
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
        // @ts-expect-error - Next.js version mismatch
        revalidateTag("analysis")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to delete sale" }
    }
}
