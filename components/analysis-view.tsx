"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { AnalysisData, getAnalysisData, DateRange } from "@/app/actions/analysis"
import { BarChart3, Package, Activity, TrendingUp, TrendingDown, Wallet, Layers, CreditCard, Scale } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { tr } from "date-fns/locale"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useParams } from "next/navigation"
import { DatePickerWithRange as DateRangePicker } from "@/components/ui/date-range-picker"

interface AnalysisViewProps {
    data: AnalysisData
}

export default function AnalysisView({ data: initialData }: AnalysisViewProps) {
    const params = useParams()
    const brand = params.brand as string
    const [data, setData] = useState<AnalysisData>(initialData)
    const [storeFilter, setStoreFilter] = useState("all")
    const [dateRange, setDateRange] = useState<DateRange>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
    })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            const res = await getAnalysisData(brand, storeFilter, dateRange)
            if (res.success && res.data) {
                setData(res.data)
            }
            setLoading(false)
        }
        fetchData()
    }, [storeFilter, brand, dateRange])

    const { kpis, monthlyStats, productStats, discountStats } = data

    const fmt = (v: number | undefined | null, prefix = "", suffix = "") => {
        if (v === undefined || v === null || isNaN(v)) return `${prefix}0,00${suffix}`
        return `${prefix}${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}${suffix}`
    }

    // Exact Currency Format as per Lamiaferis
    const formatCurrency = (val: number) =>
        val.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })

    // Detailed KPI Card (Lamiaferis Grid Style)
    const DetailKpiCard = ({ title, value, formatValue, type = "neutral" }: { title: string, value: number, formatValue: (v: number) => string, type?: "neutral" | "emerald" | "red" | "blue" }) => {
        const styles = {
            neutral: { dot: "bg-slate-400 shadow-slate-200", hover: "hover:border-slate-300", text: "group-hover:text-slate-700" },
            emerald: { dot: "bg-emerald-400 shadow-emerald-200", hover: "hover:border-emerald-200", text: "group-hover:text-emerald-700" },
            red: { dot: "bg-red-400 shadow-red-200", hover: "hover:border-red-200", text: "group-hover:text-red-700" },
            blue: { dot: "bg-blue-400 shadow-blue-200", hover: "hover:border-blue-200", text: "group-hover:text-blue-700" },
        }[type]

        return (
            <div className={`bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all group cursor-default ${styles.hover}`}>
                <div className="flex items-center gap-2 mb-2 border-b border-slate-50 pb-2">
                    <span className={`w-2 h-2 rounded-full shadow-sm ${styles.dot}`}></span>
                    <span className="text-xs font-bold text-slate-500 uppercase truncate leading-none tracking-wide" title={title}>
                        {title}
                    </span>
                </div>
                <div className={`text-lg font-bold text-slate-700 transition-colors ${styles.text}`}>
                    {formatValue(value)}
                </div>
            </div>
        )
    }

    // Calculate Net Profit for Top 3
    const totalRevenue = monthlyStats.reduce((sum, m) => sum + m.revenueUSD, 0)
    // Total Expense now excludes External Expenses (handled in backend)
    const totalExpense = monthlyStats.reduce((sum, m) => sum + (m.costUSD + m.expenseUSD), 0)
    const netProfit = totalRevenue - totalExpense

    return (
        <div className="space-y-8">
            {/* Header & Filter */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-slate-900" />
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Analiz</h2>
                        <p className="text-sm text-slate-500">Performans metrikleri ve finansal özet.</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <DateRangePicker
                        date={dateRange}
                        setDate={(range) => {
                            if (range?.from) {
                                setDateRange({ from: range.from, to: range.to || range.from })
                            }
                        }}
                    />
                    <Select value={storeFilter} onValueChange={setStoreFilter}>
                        <SelectTrigger className="w-full sm:w-[200px] bg-white border-slate-200 text-slate-900 h-10">
                            <SelectValue placeholder="Mağaza Seç" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-slate-900">
                            <SelectItem value="all">Tüm Mağazalar</SelectItem>
                            <SelectItem value="RADIANT_JEWELRY_GIFT">Radiant Jewelry Gift</SelectItem>
                            <SelectItem value="THE_TRENDY_OUTFITTERS">The Trendy Outfitters</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* TOP 3 KPIs (EXACT Lamiaferis Copy) */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-white rounded-xl p-6 border border-slate-100 border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Toplam Gelir</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{fmt(totalRevenue, "$")}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-full">
                        <TrendingUp className="h-8 w-8 text-emerald-600 opacity-90" />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-slate-100 border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Toplam Gider</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{fmt(kpis.totalCost, "$")}</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-full">
                        <TrendingDown className="h-8 w-8 text-red-600 opacity-90" />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-slate-100 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Net Kar</p>
                        <p className={`text-3xl font-bold mt-2 ${netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                            {fmt(netProfit, "$")}
                        </p>
                        <p className={`text-sm font-semibold mt-1 ${kpis.totalProfitTL >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {fmt(kpis.totalProfitTL, "₺")}
                        </p>
                    </div>
                    <div className={`p-3 rounded-full ${netProfit >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                        <Scale className={`h-8 w-8 opacity-90 ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
                    </div>
                </div>
            </div>

            {/* DETAILED KPI GRID */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1 py-2">
                    <Layers className="h-3.5 w-3.5" />
                    Detaylı Metrikler
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-[repeat(9,minmax(0,1fr))] gap-4">
                    <DetailKpiCard title="Satış Adedi" value={kpis.totalSalesCount} formatValue={(v) => v.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} type="blue" />

                    <DetailKpiCard title="Net Kar ($)" value={kpis.totalProfitUSD} formatValue={(v) => fmt(v, "$")} type={kpis.totalProfitUSD >= 0 ? "emerald" : "red"} />

                    <div className="bg-white rounded-xl border border-emerald-100 p-4 shadow-sm hover:shadow-md transition-all group cursor-default hover:border-emerald-200">
                        <div className="flex items-center gap-2 mb-2 border-b border-slate-50 pb-2">
                            <span className="w-2 h-2 rounded-full shadow-sm bg-emerald-400 shadow-emerald-200"></span>
                            <span className="text-xs font-bold text-slate-500 uppercase truncate leading-none tracking-wide" title="Net Kar (TL)">
                                Net Kar (TL)
                            </span>
                        </div>
                        <div className="text-lg font-bold text-slate-700 transition-colors group-hover:text-emerald-700">
                            {fmt(kpis.totalGrossProfitTL, "₺")}
                        </div>
                    </div>

                    <DetailKpiCard title="Kesintiler ($)" value={kpis.totalFeesUSD} formatValue={(v) => fmt(v, "$")} type="red" />
                    <DetailKpiCard title="Ürün Maliyeti" value={kpis.totalProductCost} formatValue={(v) => fmt(v, "$")} type="red" />
                    <DetailKpiCard title="Kargo Maliyeti" value={kpis.totalShippingCost} formatValue={(v) => fmt(v, "$")} type="red" />
                    <DetailKpiCard title="Listing Fees" value={kpis.listingFeesExpense} formatValue={(v) => fmt(v, "$")} type="red" />
                    <DetailKpiCard title="Etsy Ads" value={kpis.etsyAdsExpense} formatValue={(v) => fmt(v, "$")} type="red" />
                    <DetailKpiCard title="Etsy Ads (TL)" value={kpis.etsyAdsExpenseTL} formatValue={(v) => fmt(v, "₺")} type="red" />
                </div>
            </div>

            {/* EXTERNAL EXPENSES */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1 py-2">
                    <CreditCard className="h-3.5 w-3.5" />
                    HARİCİ GİDERLER
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <DetailKpiCard title="ShipEntegra ($)" value={kpis.shipEntegraExpense} formatValue={(v) => fmt(v, "$")} type="red" />
                    <DetailKpiCard title="ShipEntegra (TL)" value={kpis.shipEntegraExpenseTL} formatValue={(v) => fmt(v, "₺")} type="red" />

                    <DetailKpiCard title="Prinwork ($)" value={kpis.prinworkExpense} formatValue={(v) => fmt(v, "$")} type="red" />
                    <DetailKpiCard title="Prinwork (TL)" value={kpis.prinworkExpenseTL} formatValue={(v) => fmt(v, "₺")} type="red" />

                    <DetailKpiCard title="Rexven ($)" value={kpis.rexvenExpense} formatValue={(v) => fmt(v, "$")} type="red" />
                    <DetailKpiCard title="Rexven (TL)" value={kpis.rexvenExpenseTL} formatValue={(v) => fmt(v, "₺")} type="red" />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 mt-8">
                {/* PERFORMANCE TABLE */}
                <PerformanceTable monthlyStats={monthlyStats} />
            </div>

            {/* BREAKDOWNS: PRODUCTS & ADS */}
            <div className="grid grid-cols-2 gap-8">
                {/* Product Performance */}
                <Card className="col-span-2 lg:col-span-1 shadow-sm border-slate-200 p-0 gap-0">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-2 px-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <CardTitle className="text-base font-bold text-slate-800">Ürün Performansı</CardTitle>
                                <CardDescription className="text-xs text-slate-500">En çok kazandıran ürünler</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[400px] overflow-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-white shadow-sm z-10">
                                    <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                                        <TableHead className="py-2 px-3 font-bold text-slate-700 w-[40%] text-xs uppercase tracking-wider">Ürün</TableHead>
                                        <TableHead className="py-2 px-3 text-right font-bold text-slate-700 text-xs uppercase tracking-wider">Adet</TableHead>
                                        <TableHead className="py-2 px-3 text-right font-bold text-slate-700 text-xs uppercase tracking-wider">Kar $</TableHead>
                                        <TableHead className="py-2 px-3 text-right font-bold text-slate-700 text-xs uppercase tracking-wider">Kar ₺</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {productStats.map((item) => (
                                        <TableRow key={item.productName} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                                            <TableCell className="py-2 px-3 font-medium text-slate-700 truncate max-w-[200px]" title={item.productName}>
                                                {item.productName}
                                            </TableCell>
                                            <TableCell className="py-2 px-3 text-right text-slate-600">{item.salesCount}</TableCell>
                                            <TableCell className={cn(
                                                "py-2 px-3 text-right font-bold",
                                                item.profitUSD >= 0 ? "text-emerald-600" : "text-red-600"
                                            )}>
                                                {fmt(item.profitUSD, "$")}
                                            </TableCell>
                                            <TableCell className={cn(
                                                "py-2 px-3 text-right font-bold",
                                                item.profitTL >= 0 ? "text-emerald-600" : "text-red-600"
                                            )}>
                                                {fmt(item.profitTL, "₺")}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Etsy Ads Analysis Table */}
                <Card className="col-span-2 lg:col-span-1 shadow-sm border-slate-200 p-0 gap-0">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-2 px-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <CardTitle className="text-base font-bold text-slate-800">Etsy Ads Analizi</CardTitle>
                                <CardDescription className="text-xs text-slate-500">Aylık reklam performansı ve maliyet analizi</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[400px] overflow-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-white shadow-sm z-10">
                                    <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                                        <TableHead className="py-2 px-3 font-bold text-slate-700 text-xs uppercase tracking-wider">Ay</TableHead>
                                        <TableHead className="py-2 px-3 text-right font-bold text-slate-700 text-xs uppercase tracking-wider">Harcama</TableHead>
                                        <TableHead className="py-2 px-3 text-right font-bold text-slate-700 text-xs uppercase tracking-wider">Satış</TableHead>
                                        <TableHead className="py-2 px-3 text-right font-bold text-slate-700 text-xs uppercase tracking-wider">Maliyet</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {monthlyStats.map((stat) => {
                                        const cpa = stat.salesCount > 0 ? (stat.etsyAdsUSD / stat.salesCount) : 0
                                        return (
                                            <TableRow key={stat.month} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                                                <TableCell className="py-2 px-3 font-medium text-slate-700">{stat.month}</TableCell>
                                                <TableCell className="py-2 px-3 text-right text-slate-600">{fmt(stat.etsyAdsUSD, "$")}</TableCell>
                                                <TableCell className="py-2 px-3 text-right text-slate-600">{stat.salesCount}</TableCell>
                                                <TableCell className="py-2 px-3 text-right font-bold text-slate-700">
                                                    {fmt(cpa, "$")}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                                <TableFooter className="bg-slate-100/50 border-t border-slate-200 font-bold">
                                    <TableRow>
                                        <TableCell className="py-2 px-3 text-slate-800 text-left">Toplam</TableCell>
                                        <TableCell className="py-2 px-3 text-right text-slate-800">
                                            {fmt(monthlyStats.reduce((sum, s) => sum + s.etsyAdsUSD, 0), "$")}
                                        </TableCell>
                                        <TableCell className="text-right text-slate-800 px-4">
                                            {monthlyStats.reduce((sum, s) => sum + s.salesCount, 0)}
                                        </TableCell>
                                        <TableCell className="text-right text-slate-800 px-4">
                                            {(() => {
                                                const totalAds = monthlyStats.reduce((sum, s) => sum + s.etsyAdsUSD, 0)
                                                const totalSales = monthlyStats.reduce((sum, s) => sum + s.salesCount, 0)
                                                return fmt(totalSales > 0 ? totalAds / totalSales : 0, "$")
                                            })()}
                                        </TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* DISCOUNT BREAKDOWN */}
                <div className="col-span-2 lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-slate-500" /> İndirim Bazlı Karlılık
                    </h3>
                    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow className="border-b border-slate-200">
                                    <TableHead className="py-2 px-3 text-left font-bold text-slate-700 border-r border-slate-200 text-xs uppercase tracking-wider">İndirim</TableHead>
                                    <TableHead className="py-2 px-3 text-center font-bold text-slate-700 border-r border-slate-200 text-xs uppercase tracking-wider">Adet</TableHead>
                                    <TableHead className="py-2 px-3 text-right font-bold text-slate-700 text-xs uppercase tracking-wider">Toplam Kar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {discountStats && discountStats.length > 0 ? (
                                    discountStats.map((stat, idx) => (
                                        <TableRow key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                                            <TableCell className="py-2 px-3 font-medium text-slate-900 border-r border-slate-100">
                                                {stat.rate}
                                            </TableCell>
                                            <TableCell className="py-2 px-3 text-center text-slate-700 border-r border-slate-100">{stat.count}</TableCell>
                                            <TableCell className={`py-2 px-3 text-right font-bold ${stat.profitUSD >= 0 ? "text-green-600" : "text-red-600"} `}>
                                                ${stat.profitUSD ? stat.profitUSD.toFixed(2) : "0.00"}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={3} className="text-center py-6 text-slate-500">Veri yok</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    )
}

function PerformanceTable({ monthlyStats }: { monthlyStats: AnalysisData['monthlyStats'] }) {
    const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly")
    const currentYear = new Date().getFullYear().toString()
    const [selectedYear, setSelectedYear] = useState(currentYear)

    // Extract available years from data
    const years = Array.from(new Set(monthlyStats.map(s => s.month.substring(0, 4)))).sort((a, b) => b.localeCompare(a))
    if (years.length === 0 && !years.includes(currentYear)) years.push(currentYear)

    // Process Data
    const processedData = (() => {
        const formatTL = (v: number) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
        const formatUSD = (v: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)

        if (viewMode === "yearly") {
            // Aggregate by Year
            const yearMap = new Map<string, any>()
            monthlyStats.forEach(stat => {
                const year = stat.month.substring(0, 4)
                const curr = yearMap.get(year) || {
                    period: year,
                    revenue: 0,
                    expense: 0,
                    netProfit: 0,
                    netProfitTL: 0
                }
                const totalExpense = stat.costUSD + stat.expenseUSD
                // Formula: Net Profit = Revenue - Total Expense
                const netProfit = stat.revenueUSD - totalExpense

                // Net Profit TL (using pre-calculated profitTL from backend which handles expenses correctly if implemented, 
                // but actually monthlyStats profitTL is from sales. expenseTL is from expenses.
                // So Net Profit TL = Revenue TL ??? No.
                // monthlyStats has: profitTL (from sales), expenseTL (operational expenses).
                // So Net Profit TL = profitTL - expenseTL (assuming profitTL is Gross Profit TL from sales).
                // Let's verify backend logic. profitTL in sales is RevenueTL - CostTL. So it is Gross Profit.
                // So Net Profit TL = stat.profitTL - stat.expenseTL.
                const netProfitTL = stat.profitTL - stat.expenseTL

                curr.revenue += stat.revenueUSD
                curr.expense += totalExpense
                curr.netProfit += netProfit
                curr.netProfitTL += netProfitTL
                yearMap.set(year, curr)
            })
            return Array.from(yearMap.values()).sort((a, b) => b.period.localeCompare(a.period))
        } else {
            // Filter by Year
            return monthlyStats
                .filter(s => s.month.startsWith(selectedYear))
                .map(stat => {
                    const totalExpense = stat.costUSD + stat.expenseUSD
                    const netProfit = stat.revenueUSD - totalExpense
                    // Calculate Net Profit TL
                    const netProfitTL = stat.profitTL - stat.expenseTL

                    return {
                        period: format(new Date(stat.month), "MMMM", { locale: tr }),
                        revenue: stat.revenueUSD,
                        expense: totalExpense,
                        netProfit: netProfit,
                        netProfitTL: netProfitTL,
                        rawDate: stat.month // for sorting if needed, but filter is usually enough
                    }
                })
        }
    })()

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-slate-500" /> Performans Tablosu
                </h3>
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                    {/* Moved Year Select Here */}
                    {viewMode === "monthly" && (
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="w-[100px] bg-white border-slate-200 h-8 text-sm">
                                <SelectValue placeholder="Yıl" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                {years.map(y => (
                                    <SelectItem key={y} value={y}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    <button
                        onClick={() => setViewMode("monthly")}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === "monthly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                    >
                        Aylık
                    </button>
                    <button
                        onClick={() => setViewMode("yearly")}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === "yearly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                    >
                        Yıllık
                    </button>
                </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow className="border-b border-slate-200">
                            <TableHead className="py-2 px-3 text-left font-bold text-slate-700 border-r border-slate-200 text-xs uppercase tracking-wider">Tarih</TableHead>
                            <TableHead className="py-2 px-3 text-right font-bold text-slate-700 border-r border-slate-200 text-xs uppercase tracking-wider">Gelir</TableHead>
                            <TableHead className="py-2 px-3 text-right font-bold text-slate-700 border-r border-slate-200 text-xs uppercase tracking-wider">Gider</TableHead>
                            <TableHead className="py-2 px-3 text-right font-bold text-slate-700 text-xs uppercase tracking-wider">Net Kar</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {processedData.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-6 text-slate-500">Veri yok</TableCell></TableRow>
                        ) : (
                            processedData.map((row, idx) => (
                                <TableRow key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                                    <TableCell className="py-2 px-3 font-medium text-slate-900 border-r border-slate-100">
                                        {row.period}
                                    </TableCell>
                                    <TableCell className="py-2 px-3 text-right text-slate-700 border-r border-slate-100">${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(row.revenue)}</TableCell>
                                    <TableCell className="py-2 px-3 text-right text-red-600 border-r border-slate-100">
                                        -${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(row.expense)}
                                    </TableCell>
                                    <TableCell className="py-2 px-3 text-right font-bold">
                                        <div className={row.netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                                            ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(row.netProfit)}
                                        </div>
                                        <div className={`text-xs ${row.netProfitTL >= 0 ? "text-green-500" : "text-red-500"}`}>
                                            {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(row.netProfitTL)} ₺
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
