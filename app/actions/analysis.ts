"use server"

import { prisma } from "@/lib/prisma"
import { Store } from "@prisma/client"
import { startOfMonth, format, subMonths } from "date-fns"
import { tr } from "date-fns/locale"

export interface AnalysisData {
    kpis: {
        totalSalesCount: number
        totalProfitUSD: number
        totalProfitTL: number
        totalCost: number
        totalProductCost: number
        totalShippingCost: number
        shipEntegraExpense: number
        prinworkExpense: number
        etsyAdsExpense: number
    }
    monthlyStats: {
        month: string
        revenueUSD: number
        revenueTL: number
        costUSD: number
        expenseUSD: number
        profitUSD: number
        profitTL: number
    }[]
    productStats: {
        productName: string
        salesCount: number
        revenueUSD: number
        profitUSD: number
    }[]
}

export async function getAnalysisData(brand: string, store?: string): Promise<{ success: boolean; data?: AnalysisData; error?: string }> {
    try {
        // Determine store filter
        let whereClause: any = {}

        if (store && store !== "all") {
            whereClause.store = store as Store
        } else if (brand === "radiant-jewelry-gift") {
            whereClause.store = "RADIANT_JEWELRY_GIFT"
        } else if (brand === "the-trendy-outfitters") {
            whereClause.store = "THE_TRENDY_OUTFITTERS"
        } else if (brand === "lamiaferis") {
            whereClause.store = "LAMIAFERIS"
        }
        // If brand doesn't match and store is 'all' (or not provided), we fetch everything (global admin view maybe?)

        // 1. Fetch Sales
        const sales = await prisma.sale.findMany({
            where: whereClause,
            include: { product: true },
            orderBy: { date: 'desc' }
        })

        // 2. Fetch Expenses
        const expenses = await prisma.expense.findMany({
            where: whereClause,
            orderBy: { date: 'desc' }
        })

        // --- KPI CALCULATIONS ---
        const totalSalesCount = sales.reduce((sum, s) => sum + s.quantity, 0)
        const totalProfitUSD = sales.reduce((sum, s) => sum + s.profitUSD, 0)
        const totalProfitTL = sales.reduce((sum, s) => sum + s.profitTL, 0)
        const totalProductCost = sales.reduce((sum, s) => sum + s.productCost, 0)
        const totalShippingCost = sales.reduce((sum, s) => sum + s.shippingCost, 0)
        const totalCost = totalProductCost + totalShippingCost

        // Category-specific Expenses (Case-insensitive check might be good, but for now exact or includes)
        // User specified categories: "ShipEntegra", "Prinwork", "Etsy Ads"
        // We will assume the Category string contains these keywords or matches.
        const checkCategory = (cat: string, target: string) => cat.toLowerCase().includes(target.toLowerCase())

        const shipEntegraExpense = expenses
            .filter(e => checkCategory(e.category, "ShipEntegra"))
            .reduce((sum, e) => sum + (e.amountUSD || 0), 0)

        const prinworkExpense = expenses
            .filter(e => checkCategory(e.category, "Prinwork"))
            .reduce((sum, e) => sum + (e.amountUSD || 0), 0)

        const etsyAdsExpense = expenses
            .filter(e => checkCategory(e.category, "Etsy Ads"))
            .reduce((sum, e) => sum + (e.amountUSD || 0), 0)


        // --- MONTHLY STATS ---
        const monthlyMap = new Map<string, {
            revenueUSD: number, revenueTL: number, costUSD: number, expenseUSD: number, profitUSD: number, profitTL: number
        }>()

        // Process Sales for Monthly
        sales.forEach(sale => {
            const monthKey = format(sale.date, "yyyy-MM")
            const current = monthlyMap.get(monthKey) || { revenueUSD: 0, revenueTL: 0, costUSD: 0, expenseUSD: 0, profitUSD: 0, profitTL: 0 }

            current.revenueUSD += sale.buyerPaid
            current.revenueTL += sale.totalSalePriceTL
            current.costUSD += (sale.productCost + sale.shippingCost + sale.feesCredits) // Fees are also costs deducted from revenue
            current.profitUSD += sale.profitUSD
            current.profitTL += sale.profitTL

            monthlyMap.set(monthKey, current)
        })

        // Process Expenses for Monthly
        expenses.forEach(expense => {
            const monthKey = format(expense.date, "yyyy-MM")
            const current = monthlyMap.get(monthKey) || { revenueUSD: 0, revenueTL: 0, costUSD: 0, expenseUSD: 0, profitUSD: 0, profitTL: 0 }

            current.expenseUSD += (expense.amountUSD || 0)
            // Net profit should theoretically deduct expenses too, but usually "Profit" in sales table is Gross Profit (Sale - COGS).
            // "Net Profit" in Monthly table usually means Gross Profit - Operating Expenses.
            // We will calculate a "Net" line in the UI or adjust here.

            monthlyMap.set(monthKey, current)
        })

        const monthlyStats = Array.from(monthlyMap.entries())
            .map(([month, stats]) => ({
                month,
                ...stats
            }))
            .sort((a, b) => b.month.localeCompare(a.month)) // Newest first


        // --- PRODUCT STATS ---
        const productMap = new Map<string, { count: number, revenue: number, profit: number }>()
        sales.forEach(sale => {
            const name = sale.product?.name || "Unknown Product"
            const current = productMap.get(name) || { count: 0, revenue: 0, profit: 0 }

            current.count += sale.quantity
            current.revenue += sale.buyerPaid
            current.profit += sale.profitUSD

            productMap.set(name, current)
        })

        const productStats = Array.from(productMap.entries())
            .map(([productName, stats]) => ({
                productName,
                salesCount: stats.count,
                revenueUSD: stats.revenue,
                profitUSD: stats.profit
            }))
            .sort((a, b) => b.profitUSD - a.profitUSD) // Highest profit first

        return {
            success: true,
            data: {
                kpis: {
                    totalSalesCount,
                    totalProfitUSD,
                    totalProfitTL,
                    totalCost,
                    totalProductCost,
                    totalShippingCost,
                    shipEntegraExpense,
                    prinworkExpense,
                    etsyAdsExpense
                },
                monthlyStats,
                productStats
            }
        }

    } catch (error) {
        console.error("Analysis Error:", error)
        return { success: false, error: "Failed to fetch analysis data" }
    }
}
