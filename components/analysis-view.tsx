
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AnalysisData, getAnalysisData } from "@/app/actions/analysis"
import { BarChart3, Package, TrendingUp, DollarSign, Truck, ShoppingBag, Activity, Filter } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useParams } from "next/navigation"

interface AnalysisViewProps {
    data: AnalysisData
}

export default function AnalysisView({ data: initialData }: AnalysisViewProps) {
    const params = useParams()
    const brand = params.brand as string
    const [data, setData] = useState<AnalysisData>(initialData)
    const [storeFilter, setStoreFilter] = useState("all")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            const res = await getAnalysisData(brand, storeFilter)
            if (res.success && res.data) {
                setData(res.data)
            }
            setLoading(false)
        }
        fetchData()
    }, [storeFilter, brand])

    const { kpis, monthlyStats, productStats } = data

    // Helper for KPI Cards
    const KpiCard = ({ title, value, formatValue }: any) => (
        <Card className="bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-all duration-200 rounded-xl flex flex-col justify-center items-center text-center px-3 py-4 h-full w-full gap-2">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap overflow-hidden text-ellipsis w-full opacity-90">
                {title}
            </span>
            <div className="text-xl font-bold text-slate-900 tracking-tight leading-none">{formatValue(value)}</div>
        </Card>
    )

    const fmt = (v: number, prefix = "", suffix = "") => {
        return `${prefix}${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(v))}${suffix}`
    }

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
                <div className="w-full sm:w-[200px]">
                    <Select value={storeFilter} onValueChange={setStoreFilter}>
                        <SelectTrigger className="bg-white border-slate-200 text-slate-900 h-9 rounded-lg">
                            <SelectValue placeholder="Mağaza Seç" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-slate-900">
                            <SelectItem value="all">Tüm Mağazalar</SelectItem>
                            <SelectItem value="RADIANT_JEWELRY_GIFT">Radiant Jewelry Gift</SelectItem>
                            <SelectItem value="THE_TRENDY_OUTFITTERS">The Trendy Outfitters</SelectItem>
                            <SelectItem value="LAMIAFERIS">Lamiaferis</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* KPI GRID - 2 Rows of 5 Columns (9 items total) */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* Row 1 */}
                <KpiCard title="Satış Adedi" value={kpis.totalSalesCount} formatValue={(v: number) => fmt(v)} />
                <KpiCard title="Toplam Kar ($)" value={kpis.totalProfitUSD} formatValue={(v: number) => fmt(v, "$")} />
                <KpiCard title="Toplam Kar (TL)" value={kpis.totalProfitTL} formatValue={(v: number) => fmt(v, "₺")} />
                <KpiCard title="Toplam Maliyet" value={kpis.totalCost} formatValue={(v: number) => fmt(v, "$")} />
                <KpiCard title="Ürün Maliyeti" value={kpis.totalProductCost} formatValue={(v: number) => fmt(v, "$")} />

                {/* Row 2 */}
                <KpiCard title="Kargo Maliyeti" value={kpis.totalShippingCost} formatValue={(v: number) => fmt(v, "$")} />
                <KpiCard title="ShipEntegra" value={kpis.shipEntegraExpense} formatValue={(v: number) => fmt(v, "$")} />
                <KpiCard title="Prinwork" value={kpis.prinworkExpense} formatValue={(v: number) => fmt(v, "$")} />
                <KpiCard title="Etsy Ads" value={kpis.etsyAdsExpense} formatValue={(v: number) => fmt(v, "$")} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* MONTHLY BREAKDOWN */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-slate-500" /> Aylık Performans
                    </h3>
                    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow className="border-b border-slate-200">
                                    <TableHead className="py-3 px-4 text-left font-bold text-slate-700 border-r border-slate-200">Ay</TableHead>
                                    <TableHead className="py-3 px-4 text-right font-bold text-slate-700 border-r border-slate-200">Gelir ($)</TableHead>
                                    <TableHead className="py-3 px-4 text-right font-bold text-slate-700 border-r border-slate-200">Gider ($)</TableHead>
                                    <TableHead className="py-3 px-4 text-right font-bold text-slate-700">Net Kar ($)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {monthlyStats.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-6 text-slate-500">Veri yok</TableCell></TableRow>
                                ) : (
                                    monthlyStats.map((stat) => (
                                        <TableRow key={stat.month} className="border-b border-slate-100 hover:bg-slate-50">
                                            <TableCell className="py-2 px-4 font-medium text-slate-900 border-r border-slate-100">
                                                {format(new Date(stat.month), "MMMM", { locale: tr })}
                                            </TableCell>
                                            <TableCell className="py-2 px-4 text-right text-slate-700 border-r border-slate-100">${stat.revenueUSD.toFixed(0)}</TableCell>
                                            {/* Cost + Expenses */}
                                            <TableCell className="py-2 px-4 text-right text-red-600 border-r border-slate-100">
                                                -${(stat.costUSD + stat.expenseUSD).toFixed(0)}
                                            </TableCell>
                                            <TableCell className={`py - 2 px - 4 text - right font - bold ${stat.profitUSD - stat.expenseUSD >= 0 ? "text-green-600" : "text-red-600"} `}>
                                                ${(stat.profitUSD - stat.expenseUSD).toFixed(0)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* PRODUCT BREAKDOWN */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Package className="h-5 w-5 text-slate-500" /> Ürün Bazlı Karlılık (Top 10)
                    </h3>
                    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow className="border-b border-slate-200">
                                    <TableHead className="py-3 px-4 text-left font-bold text-slate-700 border-r border-slate-200">Ürün</TableHead>
                                    <TableHead className="py-3 px-4 text-center font-bold text-slate-700 border-r border-slate-200">Adet</TableHead>
                                    <TableHead className="py-3 px-4 text-right font-bold text-slate-700">Toplam Kar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {productStats.slice(0, 10).length === 0 ? (
                                    <TableRow><TableCell colSpan={3} className="text-center py-6 text-slate-500">Veri yok</TableCell></TableRow>
                                ) : (
                                    productStats.slice(0, 10).map((product, idx) => (
                                        <TableRow key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                                            <TableCell className="py-2 px-4 font-medium text-slate-900 border-r border-slate-100 truncate max-w-[200px]" title={product.productName}>
                                                {product.productName}
                                            </TableCell>
                                            <TableCell className="py-2 px-4 text-center text-slate-700 border-r border-slate-100">{product.salesCount}</TableCell>
                                            <TableCell className={`py - 2 px - 4 text - right font - bold ${product.profitUSD >= 0 ? "text-green-600" : "text-red-600"} `}>
                                                ${product.profitUSD.toFixed(0)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

        </div>
    )
}

