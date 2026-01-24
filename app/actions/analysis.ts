"use server"

import { prisma } from "@/lib/prisma"
import { Store } from "@prisma/client"
import { startOfMonth, format, subMonths, eachDayOfInterval, eachMonthOfInterval, startOfDay, endOfDay, isSameDay, isSameMonth } from "date-fns"
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
        shipEntegraExpenseTL: number
        prinworkExpense: number
        prinworkExpenseTL: number
        rexvenExpense: number
        rexvenExpenseTL: number
        etsyAdsExpense: number
    }
    // For Trend Chart (Revenue, Profit, Expense over time)
    trendStats: {
        date: string // label (e.g., "1 Jan" or "Jan 2024")
        revenueUSD: number
        profitUSD: number
        expenseUSD: number
    }[]
    // For Expense Breakdown Pie Chart
    expenseBreakdown: {
        category: string
        amountUSD: number
        fill: string // Color for chart
    }[]
    // For Discount Rate Chart
    discountStats: {
        rate: string // e.g., "%25", "%30", "No Discount"
        revenueUSD: number
        profitUSD: number
        count: number
    }[]
    // For Monthly Performance Table & TL Chart (keeping existing structure but enhancing)
    monthlyStats: {
        month: string
        revenueUSD: number
        revenueTL: number
        costUSD: number // COGS + Shipping
        expenseUSD: number // Operational Expenses
        profitUSD: number
        profitTL: number
        expenseTL: number // Added for TL Chart
    }[]
    // Product Performance
    productStats: {
        productName: string
        salesCount: number
        revenueUSD: number
        profitUSD: number
    }[]
}

export type DateRange = {
    from: Date
    to: Date
}

export async function getAnalysisData(brand: string, store?: string, dateRange?: DateRange): Promise<{ success: boolean; data?: AnalysisData; error?: string }> {
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

        // Apply Date Filter
        if (dateRange && dateRange.from && dateRange.to) {
            whereClause.date = {
                gte: startOfDay(dateRange.from),
                lte: endOfDay(dateRange.to),
            }
        }

        // 1. Fetch Sales
        const sales = await prisma.sale.findMany({
            where: whereClause,
            include: { product: true },
            orderBy: { date: 'asc' } // Sorted asc for trend calculation
        })

        // 2. Fetch Expenses
        const expenses = await prisma.expense.findMany({
            where: whereClause,
            orderBy: { date: 'asc' }
        })

        // --- KPI CALCULATIONS ---
        const totalSalesCount = sales.reduce((sum, s) => sum + s.quantity, 0)
        const totalProfitUSD = sales.reduce((sum, s) => sum + s.profitUSD, 0)
        const totalProfitTL = sales.reduce((sum, s) => sum + s.profitTL, 0)
        const totalProductCost = sales.reduce((sum, s) => sum + s.productCost, 0)
        const totalShippingCost = sales.reduce((sum, s) => sum + s.shippingCost, 0)
        const totalCost = totalProductCost + totalShippingCost

        // Category-specific Expenses
        const checkCategory = (cat: string, target: string) => cat.toLowerCase().includes(target.toLowerCase())

        // Helper to calc USD and TL
        const calcExpense = (target: string) => {
            const filtered = expenses.filter(e => checkCategory(e.category, target))
            const usd = filtered.reduce((sum, e) => sum + (e.amountUSD || 0), 0)
            const tl = filtered.reduce((sum, e) => {
                if (e.amountTL) return sum + e.amountTL
                if (e.amountUSD && e.exchangeRate) return sum + (e.amountUSD * e.exchangeRate)
                return sum
            }, 0)
            return { usd, tl }
        }

        const shipEntegra = calcExpense("ShipEntegra")
        const prinwork = calcExpense("Prinwork")
        const rexven = calcExpense("Rexven")

        const etsyAdsExpense = expenses
            .filter(e => checkCategory(e.category, "Etsy Ads"))
            .reduce((sum, e) => sum + (e.amountUSD || 0), 0)

        // Maps to KPI object
        const kpis = {
            totalSalesCount,
            totalProfitUSD,
            totalProfitTL,
            totalCost,
            totalProductCost,
            totalShippingCost,
            shipEntegraExpense: shipEntegra.usd,
            shipEntegraExpenseTL: shipEntegra.tl,
            prinworkExpense: prinwork.usd,
            prinworkExpenseTL: prinwork.tl,
            rexvenExpense: rexven.usd,
            rexvenExpenseTL: rexven.tl,
            etsyAdsExpense
        }


        // --- TREND STATS (Daily/Monthly) ---
        // If range is > 60 days, group by Month. Else group by Day.
        const isLongRange = dateRange && dateRange.to.getTime() - dateRange.from.getTime() > (60 * 24 * 60 * 60 * 1000)

        const trendMap = new Map<string, { revenueUSD: number, profitUSD: number, expenseUSD: number }>()

        // Initialize map with 0s for continuity if needed (skipping for simplicity now, chart libraries handle gaps or we can fill)

        sales.forEach(s => {
            const key = isLongRange ? format(s.date, "MMM yyyy") : format(s.date, "d MMM")
            const curr = trendMap.get(key) || { revenueUSD: 0, profitUSD: 0, expenseUSD: 0 }
            curr.revenueUSD += s.buyerPaid
            curr.profitUSD += s.profitUSD
            trendMap.set(key, curr)
        })

        expenses.forEach(e => {
            const key = isLongRange ? format(e.date, "MMM yyyy") : format(e.date, "d MMM")
            const curr = trendMap.get(key) || { revenueUSD: 0, profitUSD: 0, expenseUSD: 0 }
            curr.expenseUSD += (e.amountUSD || 0)
            trendMap.set(key, curr)
        })

        const trendStats = Array.from(trendMap.entries()).map(([date, stats]) => ({
            date,
            ...stats
        })) // Use the order from insertion if we iterated chronologically? 
        // Since we sorted DB results ASC, insertion order is mostly preserved, but map keys might not guarantee it.
        // Better to re-sort if strict, but 'findMany' was 'asc'.
        // Actually, if we mix sales/expenses dates, map insertion order depends on which we iterate first. 
        // Simple string sort is risky ("1 Feb" comes before "2 Jan"). 
        // For now, let's rely on Recharts categorical axis or sort if needed.
        // Re-sorting by Date object parsing might be safer.


        // --- EXPENSE BREAKDOWN ---
        const expenseMap = new Map<string, number>()
        expenses.forEach(e => {
            const cat = e.category || "Other"
            expenseMap.set(cat, (expenseMap.get(cat) || 0) + (e.amountUSD || 0))
        })

        // Defined colors for common categories
        const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]
        const expenseBreakdown = Array.from(expenseMap.entries())
            .map(([category, amountUSD], idx) => ({
                category,
                amountUSD,
                fill: COLORS[idx % COLORS.length]
            }))
            .sort((a, b) => b.amountUSD - a.amountUSD)


        // --- DISCOUNT ANALYSIS ---
        const discountMap = new Map<string, { revenue: number, profit: number, count: number }>()
        sales.forEach(s => {
            const rate = s.discountRate ? `%${s.discountRate}` : "No Discount"
            const curr = discountMap.get(rate) || { revenue: 0, profit: 0, count: 0 }
            curr.revenue += s.buyerPaid
            curr.profit += s.profitUSD
            curr.count += 1
            discountMap.set(rate, curr)
        })

        const discountStats = Array.from(discountMap.entries())
            .map(([rate, val]) => ({
                rate,
                revenueUSD: val.revenue,
                profitUSD: val.profit,
                count: val.count
            }))
            .sort((a, b) => b.revenueUSD - a.revenueUSD)


        // --- MONTHLY STATS (Full Historical Table) ---
        // This usually ignores the Date Filter to show full history, OR we can respect it?
        // User asked for "Tables related to sales/expenses". If they filter "This Month", table showing only this month is correct.
        // So we reuse the filtered 'sales' and 'expenses'.

        const monthlyMap = new Map<string, {
            revenueUSD: number, revenueTL: number, costUSD: number, expenseUSD: number, profitUSD: number, profitTL: number, expenseTL: number
        }>()

        sales.forEach(sale => {
            const monthKey = format(sale.date, "yyyy-MM")
            const current = monthlyMap.get(monthKey) || { revenueUSD: 0, revenueTL: 0, costUSD: 0, expenseUSD: 0, profitUSD: 0, profitTL: 0, expenseTL: 0 }

            current.revenueUSD += sale.buyerPaid
            current.revenueTL += sale.totalSalePriceTL
            current.costUSD += (sale.productCost + sale.shippingCost + sale.feesCredits)
            current.profitUSD += sale.profitUSD
            current.profitTL += sale.profitTL

            monthlyMap.set(monthKey, current)
        })

        expenses.forEach(expense => {
            const monthKey = format(expense.date, "yyyy-MM")
            const current = monthlyMap.get(monthKey) || { revenueUSD: 0, revenueTL: 0, costUSD: 0, expenseUSD: 0, profitUSD: 0, profitTL: 0, expenseTL: 0 }

            current.expenseUSD += (expense.amountUSD || 0)

            // Calculate Expense TL:
            // If expense has explicit TL amount, use it.
            // If only USD, retrieve rate? Or use simplified calculation?
            // Expense model has exchangeRate.
            let tlAmount = expense.amountTL || 0
            if (!tlAmount && expense.amountUSD) {
                // If no TL but has USD and rate
                if (expense.exchangeRate) tlAmount = expense.amountUSD * expense.exchangeRate
                else {
                    // Fallback: estimate? or 0. For accurate PnL, we need rates.
                    // For now, let's leave 0 if not capturable to avoid bad data.
                    tlAmount = 0
                }
            }
            current.expenseTL += tlAmount

            monthlyMap.set(monthKey, current)
        })

        const monthlyStats = Array.from(monthlyMap.entries())
            .map(([month, stats]) => ({
                month,
                ...stats
            }))
            .sort((a, b) => b.month.localeCompare(a.month))


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
            .sort((a, b) => b.profitUSD - a.profitUSD)

        return {
            success: true,
            data: {
                kpis,
                trendStats,
                expenseBreakdown,
                discountStats,
                monthlyStats,
                productStats
            }
        }

    } catch (error) {
        console.error("Analysis Error:", error)
        return { success: false, error: "Failed to fetch analysis data" }
    }
}
