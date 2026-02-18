"use server"

import { prisma } from "@/lib/prisma"
import { Store } from "@prisma/client"
import { startOfMonth, format, subMonths, eachDayOfInterval, eachMonthOfInterval, startOfDay, endOfDay, isSameDay, isSameMonth } from "date-fns"
import { tr } from "date-fns/locale"
import { unstable_cache } from "next/cache"

export interface AnalysisData {
    kpis: {
        totalSalesCount: number
        totalSalesRevenueTL: number
        totalFeesTL: number
        totalFeesUSD: number
        totalProfitUSD: number
        totalProfitTL: number
        totalGrossProfitTL: number
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
        etsyAdsExpenseTL: number
        listingFeesExpense: number // New
        etsyPlusExpense: number // New
        cloudFixExpense: number // New
        cloudFixExpenseTL: number // New
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
        salesCount: number // Added for Etsy Ads Table
        etsyAdsUSD: number // Added for Etsy Ads Table
    }[]
    // Product Performance
    productStats: {
        productName: string
        salesCount: number
        revenueUSD: number
        profitUSD: number
        profitTL: number // Added
    }[]
}

export type DateRange = {
    from: Date
    to: Date
}

async function getAnalysisLogic(brand: string, store?: string, dateRange?: DateRange): Promise<AnalysisData> {
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
    // Calculate totalSalesCount first
    const totalSalesCount = sales.reduce((sum, s) => sum + (s.quantity || 1), 0)

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

    const totalProfitUSD = sales.reduce((sum, s) => sum + s.profitUSD, 0)

    // New TL Metrics
    const totalSalesRevenueTL = sales.reduce((sum, s) => sum + s.totalSalePriceTL, 0)

    const totalFeesTL = sales.reduce((sum, s) => {
        // Avoid divide by zero
        if (!s.buyerPaid || s.buyerPaid === 0) return sum

        // Implied Exchange Rate for this specific sale = TotalTL / TotalUSD
        const rate = s.totalSalePriceTL / s.buyerPaid
        const feeTL = s.feesCredits * rate
        return sum + feeTL
    }, 0)

    // Profit TL from Sales (Gross)
    const salesProfitTL = sales.reduce((sum, s) => sum + s.profitTL, 0)

    const totalProductCost = sales.reduce((sum, s) => sum + s.productCost, 0)
    const totalShippingCost = sales.reduce((sum, s) => sum + s.shippingCost, 0)
    const totalFeesUSD = sales.reduce((sum, s) => {
        const fees = Number(s.feesCredits) || 0
        const tax = Number(s.tax) || 0
        return sum + (fees - tax)
    }, 0)

    const shipEntegra = calcExpense("ShipEntegra")
    const prinwork = calcExpense("Prinwork")
    const rexven = calcExpense("Rexven")
    const etsyPlus = calcExpense("Etsy Plus")
    const listingFees = calcExpense("Listing Fee")
    const cloudFix = calcExpense("CloudFix")

    // Calculate Etsy Ads Expenses
    const etsyAdsExpenses = expenses.filter(e => checkCategory(e.category, "Etsy Ads"))
    const etsyAdsStats = {
        usd: etsyAdsExpenses.reduce((sum, e) => sum + (e.amountUSD || 0), 0),
        tl: etsyAdsExpenses.reduce((sum, e) => {
            const amount = Number(e.amountTL)
            return sum + (isNaN(amount) ? 0 : amount)
        }, 0)
    }

    // Update Total Cost formula
    // Product Cost + Shipping Cost + Fees + Etsy Ads + Etsy Plus + Listing Fees + CloudFix
    const totalCost = totalProductCost + totalShippingCost + totalFeesUSD + etsyAdsStats.usd + etsyPlus.usd + listingFees.usd + cloudFix.usd

    // Update Total Profit TL = Sales Profit TL - Etsy Ads TL
    const totalProfitTL = salesProfitTL - etsyAdsStats.tl

    // Maps to KPI object
    const kpis = {
        totalSalesCount,
        totalSalesRevenueTL,
        totalFeesTL,
        totalFeesUSD,
        totalProfitUSD,
        totalProfitTL,
        totalGrossProfitTL: salesProfitTL,
        totalCost,
        totalProductCost,
        totalShippingCost,
        shipEntegraExpense: shipEntegra.usd,
        shipEntegraExpenseTL: shipEntegra.tl,
        prinworkExpense: prinwork.usd,
        prinworkExpenseTL: prinwork.tl,
        rexvenExpense: rexven.usd,
        rexvenExpenseTL: rexven.tl,
        etsyAdsExpense: etsyAdsStats.usd,
        etsyAdsExpenseTL: etsyAdsStats.tl,
        listingFeesExpense: listingFees.usd,
        etsyPlusExpense: etsyPlus.usd,
        cloudFixExpense: cloudFix.usd, // New
        cloudFixExpenseTL: cloudFix.tl // New
    }


    //// Helper to shift UTC date to TRT (UTC+3) for display/grouping
    const toTRT = (date: Date) => {
        return new Date(date.getTime() + (3 * 60 * 60 * 1000))
    }

    // --- TREND STATS (Daily/Monthly) ---
    // If range is > 60 days, group by Month. Else group by Day.
    const isLongRange = dateRange && dateRange.to.getTime() - dateRange.from.getTime() > (60 * 24 * 60 * 60 * 1000)

    const trendMap = new Map<string, { revenueUSD: number, profitUSD: number, expenseUSD: number }>()

    sales.forEach(s => {
        // Use TRT date for grouping
        const trtDate = toTRT(s.date)
        const key = isLongRange ? format(trtDate, "MMM yyyy") : format(trtDate, "d MMM", { locale: tr })
        const curr = trendMap.get(key) || { revenueUSD: 0, profitUSD: 0, expenseUSD: 0 }
        curr.revenueUSD += s.buyerPaid
        curr.profitUSD += s.profitUSD
        trendMap.set(key, curr)
    })

    expenses.forEach(e => {
        // Exclude External Expenses from Trend Stats (as per user request)
        if (checkCategory(e.category, "ShipEntegra") ||
            checkCategory(e.category, "Prinwork") ||
            checkCategory(e.category, "Rexven")) {
            return
        }

        // Use TRT date for grouping
        const trtDate = toTRT(e.date)
        const key = isLongRange ? format(trtDate, "MMM yyyy") : format(trtDate, "d MMM", { locale: tr })
        const curr = trendMap.get(key) || { revenueUSD: 0, profitUSD: 0, expenseUSD: 0 }
        curr.expenseUSD += (e.amountUSD || 0)
        trendMap.set(key, curr)
    })

    const trendStats = Array.from(trendMap.entries()).map(([date, stats]) => ({
        date,
        ...stats,
        // Profit in trend is Net (Rev - Expense)? No, usually Net Profit = Gross Profit - Op Expense
        // Logic: profit = stats.profitUSD - stats.expenseUSD
    })).map(item => ({
        ...item,
        profitUSD: item.profitUSD - item.expenseUSD
    }))

    // --- EXPENSE BREAKDOWN ---
    const expenseMap = new Map<string, number>()
    expenses.forEach(e => {
        if (checkCategory(e.category, "ShipEntegra") ||
            checkCategory(e.category, "Prinwork") ||
            checkCategory(e.category, "Rexven")) {
            return
        }

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
            profitUSD: val.profit, // This is Gross Profit from sales
            count: val.count
        }))
        .sort((a, b) => b.revenueUSD - a.revenueUSD)


    // --- MONTHLY STATS (Full Historical Table & Etsy Ads Table) ---
    const monthlyMap = new Map<string, {
        revenueUSD: number, revenueTL: number, costUSD: number, expenseUSD: number, profitUSD: number, profitTL: number, expenseTL: number,
        salesCount: number, etsyAdsUSD: number
    }>()

    sales.forEach(sale => {
        const trtDate = toTRT(sale.date)
        const monthKey = format(trtDate, "yyyy-MM")
        const current = monthlyMap.get(monthKey) || {
            revenueUSD: 0, revenueTL: 0, costUSD: 0, expenseUSD: 0, profitUSD: 0, profitTL: 0, expenseTL: 0,
            salesCount: 0, etsyAdsUSD: 0
        }

        current.revenueUSD += sale.buyerPaid
        current.revenueTL += sale.totalSalePriceTL
        current.costUSD += (sale.productCost + sale.shippingCost + sale.feesCredits)
        current.profitUSD += sale.profitUSD
        current.profitTL += sale.profitTL
        current.salesCount += (sale.quantity || 1) // Sum Quantity

        monthlyMap.set(monthKey, current)
    })

    expenses.forEach(expense => {
        // Exclude External Expenses (ShipEntegra, Prinwork, Rexven)
        if (checkCategory(expense.category, "ShipEntegra") ||
            checkCategory(expense.category, "Prinwork") ||
            checkCategory(expense.category, "Rexven")) {
            return
        }

        const trtDate = toTRT(expense.date)
        const monthKey = format(trtDate, "yyyy-MM")
        const current = monthlyMap.get(monthKey) || {
            revenueUSD: 0, revenueTL: 0, costUSD: 0, expenseUSD: 0, profitUSD: 0, profitTL: 0, expenseTL: 0,
            salesCount: 0, etsyAdsUSD: 0
        }

        current.expenseUSD += (expense.amountUSD || 0)

        // Track Etsy Ads specifically for the new table
        if (checkCategory(expense.category, "Etsy Ads")) {
            current.etsyAdsUSD += (expense.amountUSD || 0)
        }

        let tlAmount = expense.amountTL || 0
        if (!tlAmount && expense.amountUSD) {
            if (expense.exchangeRate) tlAmount = expense.amountUSD * expense.exchangeRate
            else tlAmount = 0
        }
        current.expenseTL += tlAmount

        monthlyMap.set(monthKey, current)
    })

    const monthlyStats = Array.from(monthlyMap.entries())
        .map(([month, stats]) => ({
            month,
            ...stats,
            profitUSD: stats.profitUSD - stats.expenseUSD // Net Profit
        }))
        .sort((a, b) => b.month.localeCompare(a.month))


    // --- PRODUCT STATS ---
    const productMap = new Map<string, { count: number, revenue: number, profit: number, profitTL: number }>()
    sales.forEach(sale => {
        const name = sale.product?.name || "Unknown Product"
        const current = productMap.get(name) || { count: 0, revenue: 0, profit: 0, profitTL: 0 }

        current.count += sale.quantity
        current.revenue += sale.buyerPaid
        current.profit += sale.profitUSD
        current.profitTL += sale.profitTL

        productMap.set(name, current)
    })

    const productStats = Array.from(productMap.entries())
        .map(([productName, stats]) => ({
            productName,
            salesCount: stats.count,
            revenueUSD: stats.revenue,
            profitUSD: stats.profit,
            profitTL: stats.profitTL
        }))
        .sort((a, b) => b.profitUSD - a.profitUSD)

    return {
        kpis,
        trendStats,
        expenseBreakdown,
        discountStats,
        monthlyStats,
        productStats
    }
}

export async function getAnalysisData(brand: string, store?: string, dateRange?: DateRange): Promise<{ success: boolean; data?: AnalysisData; error?: string }> {
    try {
        const getCached = unstable_cache(
            async (b, s, from, to) => getAnalysisLogic(b, s, { from: new Date(from), to: new Date(to) }),
            ['analysis-data-v9'], // Cache busted
            { tags: ['analysis'] }
        )

        // Handle case where dateRange might be undefined
        const from = dateRange?.from ? dateRange.from.toISOString() : new Date(0).toISOString()
        const to = dateRange?.to ? dateRange.to.toISOString() : new Date().toISOString()

        const data = await getCached(brand, store, from, to)
        return { success: true, data }
    } catch (error) {
        console.error("Analysis Error:", error)
        return { success: false, error: "Failed to fetch analysis data" }
    }
}
