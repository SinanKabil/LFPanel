
"use server"

import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, eachDayOfInterval, format, isSameDay, subYears } from "date-fns"
import { tr } from "date-fns/locale"
import { Store, PosTransaction, CashTransaction, Expense } from "@prisma/client"

export type DateRange = {
    from: Date
    to: Date
}

export type AnalysisFilter = {
    dateRange: DateRange
    storeId?: string | "all"
}

export async function getLamiaAnalysisData(filter: AnalysisFilter) {
    try {
        const { from, to } = filter.dateRange
        const storeId = filter.storeId === "all" ? undefined : filter.storeId

        // 0. Prepare Dates for Previous Year (YoY)
        const prevFrom = subYears(from, 1)
        const prevTo = subYears(to, 1)

        // 1. Fetch Income (POS & Cash) - CURRENT PERIOD
        // Filter by Date AND Store (if selected)
        const posTransactions = await prisma.posTransaction.findMany({
            where: {
                date: {
                    gte: startOfDay(from),
                    lte: endOfDay(to)
                },
                ...(storeId && { storeId })
            },
            include: {
                store: true
            }
        })

        const cashTransactions = await prisma.cashTransaction.findMany({
            where: {
                date: {
                    gte: startOfDay(from),
                    lte: endOfDay(to)
                },
                ...(storeId && { storeId })
            },
            include: {
                store: true
            }
        })

        // 1b. Fetch Income (POS & Cash) - PREVIOUS YEAR PERIOD
        const prevPosTransactions = await prisma.posTransaction.findMany({
            where: {
                date: {
                    gte: startOfDay(prevFrom),
                    lte: endOfDay(prevTo)
                },
                ...(storeId && { storeId })
            },
            include: { store: true }
        })

        const prevCashTransactions = await prisma.cashTransaction.findMany({
            where: {
                date: {
                    gte: startOfDay(prevFrom),
                    lte: endOfDay(prevTo)
                },
                ...(storeId && { storeId })
            },
            include: { store: true }
        })

        // 2. Fetch Expenses - CURRENT PERIOD
        // Filter by Date ONLY (Expenses are Brand-wide, Store filter does NOT apply)
        const expenses = await prisma.expense.findMany({
            where: {
                store: Store.LAMIAFERIS,
                date: {
                    gte: startOfDay(from),
                    lte: endOfDay(to)
                }
            }
        })

        // --- Aggregation ---

        //// Helper to shift UTC date to TRT (UTC+3) for display/grouping
        const toTRT = (date: Date) => {
            return new Date(date.getTime() + (3 * 60 * 60 * 1000))
        }

        // A. KPI Totals
        const totalPosIncome = posTransactions.reduce((acc: number, curr: PosTransaction) => acc + (curr.net || 0), 0)
        const totalCashIncome = cashTransactions.reduce((acc: number, curr: CashTransaction) => acc + (curr.amount || 0), 0)
        const totalIncome = totalPosIncome + totalCashIncome

        const totalExpense = expenses.reduce((acc: number, curr: Expense) => acc + (curr.amountTL || 0), 0)
        const profit = totalIncome - totalExpense

        // B. Store Based KPIs (Income Only)
        // Group income by Store Name
        const storeIncomeMap = new Map<string, number>()

        // Helper to add to map
        const addToMap = (name: string, amount: number) => {
            const current = storeIncomeMap.get(name) || 0
            storeIncomeMap.set(name, current + amount)
        }

        // We can use any here safely for the joined structure or just access property if we trust it
        posTransactions.forEach((t: any) => addToMap(t.store.name, t.net || 0))
        cashTransactions.forEach((t: any) => addToMap(t.store.name, t.amount || 0))

        const storeKpis = Array.from(storeIncomeMap.entries())
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total)

        // C. Expense Category KPIs
        const expenseCategoryMap = new Map<string, number>()
        expenses.forEach((e: Expense) => {
            const cat = e.category || "Diğer"
            const current = expenseCategoryMap.get(cat) || 0
            expenseCategoryMap.set(cat, current + (e.amountTL || 0))
        })

        const expenseKpis = Array.from(expenseCategoryMap.entries())
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total)

        // D. Daily Trend (Line Chart)
        const days = eachDayOfInterval({ start: from, end: to })
        const dailyTrend = days.map((day: Date) => {
            // Using toTRT for comparison is tricky with eachDayOfInterval (which iterates local/system time).
            // Better to iterate days and check if (toTRT(transaction.date)) falls on that day.

            const incomeForDay =
                posTransactions
                    .filter((t: PosTransaction) => isSameDay(toTRT(t.date), day))
                    .reduce((acc: number, t: PosTransaction) => acc + (t.net || 0), 0) +
                cashTransactions
                    .filter((t: CashTransaction) => isSameDay(toTRT(t.date), day))
                    .reduce((acc: number, t: CashTransaction) => acc + (t.amount || 0), 0)

            const expenseForDay = expenses
                .filter((e: Expense) => isSameDay(toTRT(e.date), day))
                .reduce((acc: number, e: Expense) => acc + (e.amountTL || 0), 0)

            // Return null for 0 values to break the line in charts if requested
            // However, Recharts needs explicit null to break lines.
            // If user wants NO line for 0, then null is correct.
            // But if it's 0 income, it IS 0.
            // Use requests: "Gelir olmayan günlerde çizgi görünmesin" -> Null.

            return {
                date: format(day, "d MMM", { locale: tr }),
                rawDate: day,
                income: incomeForDay,
                expense: expenseForDay
            }
        })

        // E. Store Summary Table
        // Need: Turnover, Avg, Max, Min, Active Days
        // We iterate over the storeIncomeMap keys to get unique stores found in this period
        // Or better, fetch all stores to include 0 ones?
        // Let's stick to active stores for now as per requirement "Ilgili tarihlerde..."

        const storeSummaryIds = new Set([...posTransactions.map((t: PosTransaction) => t.storeId), ...cashTransactions.map((t: CashTransaction) => t.storeId)])
        const storeSummary: { id: string; name: string; turnover: number; avg: number; max: number; min: number; activeDays: number }[] = []

        for (const sId of storeSummaryIds) {
            // Get all transactions for this store in range
            const storePos = posTransactions.filter((t: PosTransaction) => t.storeId === sId)
            const storeCash = cashTransactions.filter((t: CashTransaction) => t.storeId === sId)
            const allTx = [...storePos.map((t: PosTransaction) => ({ val: t.net || 0, date: t.date })), ...storeCash.map((t: CashTransaction) => ({ val: t.amount || 0, date: t.date }))]

            if (allTx.length === 0) continue

            // Casting store to any because include type is not automatically inferred perfectly in arrays sometimes
            const name = ((storePos[0] as any)?.store?.name) || ((storeCash[0] as any)?.store?.name) || "Unknown"
            // Active days count (using TRT dates)
            const uniqueDays = new Set(allTx.map((t: { val: number; date: Date }) => format(toTRT(t.date), "yyyy-MM-dd"))).size

            const turnover = allTx.reduce((acc: number, t: { val: number; date: Date }) => acc + t.val, 0)
            const max = Math.max(...allTx.map((t: { val: number; date: Date }) => t.val))
            const min = Math.min(...allTx.map((t: { val: number; date: Date }) => t.val))
            const avg = uniqueDays > 0 ? turnover / uniqueDays : 0

            storeSummary.push({
                id: sId,
                name,
                turnover,
                avg,
                max,
                min,
                activeDays: uniqueDays
            })
        }

        // F. Store Trend Lines (Daily income per store)
        // Structure: { date: "1 Jan", "Store A": 100, "Store B": 200 }
        const storeTrend = days.map((day: Date) => {
            const dayObj: { date: string;[key: string]: number | string | null } = {
                date: format(day, "d MMM", { locale: tr })
            }

            // For each store in our summary, calc daily total
            storeSummary.forEach((store: { id: string; name: string; turnover: number; avg: number; max: number; min: number; activeDays: number }) => {
                const dailyStoreIncome =
                    posTransactions
                        .filter((t: PosTransaction) => t.storeId === store.id && isSameDay(toTRT(t.date), day))
                        .reduce((acc: number, t: PosTransaction) => acc + (t.net || 0), 0) +
                    cashTransactions
                        .filter((t: CashTransaction) => t.storeId === store.id && isSameDay(toTRT(t.date), day))
                        .reduce((acc: number, t: CashTransaction) => acc + (t.amount || 0), 0)

                // Revert to showing 0
                dayObj[store.name] = dailyStoreIncome
            })

            return dayObj
        })

        // G. Monthly Summary
        const monthlySummaryMap = new Map<string, { income: number, expense: number, date: Date }>()

        // Helper to get month key
        const getMonthKey = (d: Date) => format(toTRT(d), "MMMM yyyy", { locale: tr })

        // Populate Income
        posTransactions.forEach((t: PosTransaction) => {
            const key = getMonthKey(t.date)
            const current = monthlySummaryMap.get(key) || { income: 0, expense: 0, date: startOfDay(toTRT(t.date)) } // Store date for sorting
            current.income += (t.net || 0)
            monthlySummaryMap.set(key, current)
        })
        cashTransactions.forEach((t: CashTransaction) => {
            const key = getMonthKey(t.date)
            const current = monthlySummaryMap.get(key) || { income: 0, expense: 0, date: startOfDay(toTRT(t.date)) }
            current.income += (t.amount || 0)
            monthlySummaryMap.set(key, current)
        })
        // Populate Expense
        expenses.forEach((e: Expense) => {
            const key = getMonthKey(e.date)
            const current = monthlySummaryMap.get(key) || { income: 0, expense: 0, date: startOfDay(toTRT(e.date)) }
            current.expense += (e.amountTL || 0)
            monthlySummaryMap.set(key, current)
        })

        const monthlySummary = Array.from(monthlySummaryMap.entries())
            .map(([month, data]) => ({
                month,
                income: data.income,
                expense: data.expense,
                profit: data.income - data.expense,
                rawDate: data.date
            }))
            .sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime())

        // H. Year Over Year Comparison (New)
        // We need to group previous year data by store as well
        // IMPORTANT: Previous year data also needs to be timezone adjusted if we were doing daily, but for total turnover it doesn't matter much.
        // However, active days calculation DOES matter.

        const prevStoreMap = new Map<string, { turnover: number, dates: Set<string>, name: string }>()

        const addToPrevMap = (storeId: string, storeName: string, amount: number, date: Date) => {
            const current = prevStoreMap.get(storeId) || { turnover: 0, dates: new Set<string>(), name: storeName }
            current.turnover += amount
            current.dates.add(format(toTRT(date), "yyyy-MM-dd")) // Use TRT date
            prevStoreMap.set(storeId, current)
        }

        prevPosTransactions.forEach((t: any) => addToPrevMap(t.storeId, t.store.name, t.net || 0, t.date))
        prevCashTransactions.forEach((t: any) => addToPrevMap(t.storeId, t.store.name, t.amount || 0, t.date))

        // Now merge with current storeSummary (which has current stats)
        // We iterate over ALL stores found in EITHER period to be complete.

        const allStoreIds = new Set([...storeSummary.map(s => s.id), ...prevStoreMap.keys()])
        const yoyComparison: { id: string; name: string; currentTurnover: number; currentAvg: number; prevTurnover: number; prevAvg: number }[] = []

        for (const sId of allStoreIds) {
            const current = storeSummary.find(s => s.id === sId)
            const prev = prevStoreMap.get(sId)

            const name = current?.name || prev?.name || "Unknown"

            const currentTurnover = current ? current.turnover : 0
            const currentAvg = current ? current.avg : 0

            const prevTurnover = prev ? prev.turnover : 0
            const prevActiveDays = prev ? prev.dates.size : 0
            const prevAvg = prevActiveDays > 0 ? (prevTurnover / prevActiveDays) : 0

            yoyComparison.push({
                id: sId,
                name,
                currentTurnover,
                currentAvg,
                prevTurnover,
                prevAvg
            })
        }

        // Sort by current turnover
        yoyComparison.sort((a, b) => b.currentTurnover - a.currentTurnover)


        return {
            success: true,
            data: {
                kpis: {
                    totalIncome,
                    totalExpense,
                    profit
                },
                storeKpis,
                expenseKpis,
                dailyTrend,
                storeSummary: storeSummary.sort((a, b) => b.turnover - a.turnover),
                storeTrend,
                monthlySummary,
                yoyComparison
            }
        }

    } catch (error: any) {
        console.error("Lamia Analysis Error:", error)
        return { success: false, error: error.message }
    }
}
