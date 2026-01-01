"use client"

import { useState, useEffect } from "react"
import { startOfMonth, endOfMonth } from "date-fns"
import { getLamiaAnalysisData } from "@/app/actions/lamia-analysis"
import { AnalysisFilters, DateRange } from "./analysis-filters"
import { AnalysisKpiCards } from "./analysis-kpi-cards"
import { AnalysisCharts } from "./analysis-charts"
import { AnalysisSummaryTable } from "./analysis-summary-table"
import { AnalysisMonthlyTable } from "./analysis-monthly-table"
import { AnalysisYoyTable } from "./analysis-yoy-table"
import { Loader2, BarChart3 } from "lucide-react"

export function LamiaAnalysisView() {
    const [dateRange, setDateRange] = useState<DateRange>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
    })
    const [storeId, setStoreId] = useState<string>("all")
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            const res = await getLamiaAnalysisData({ dateRange, storeId })
            if (res.success) {
                setData(res.data)
                setError(null)
            } else {
                console.error(res.error)
                setError(res.error)
            }
            setLoading(false)
        }

        fetchData()
    }, [dateRange, storeId])

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-slate-900" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Finansal Analiz</h1>
            </div>

            {/* Filters */}
            <AnalysisFilters
                dateRange={dateRange}
                setDateRange={setDateRange}
                storeId={storeId}
                setStoreId={setStoreId}
            />

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
                </div>
            ) : data ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* KPI Cards */}
                    <AnalysisKpiCards
                        kpis={data.kpis}
                        storeKpis={data.storeKpis}
                        expenseKpis={data.expenseKpis}
                    />





                    {/* Charts */}
                    <AnalysisCharts
                        dailyTrend={data.dailyTrend}
                        storeTrend={data.storeTrend}
                    />

                    {/* Tables Grid */}
                    <div className="grid gap-8 md:grid-cols-2">
                        <AnalysisSummaryTable
                            summary={data.storeSummary}
                        />

                        <AnalysisMonthlyTable
                            monthlySummary={data.monthlySummary}
                        />
                    </div>

                    {/* YoY Comparison */}
                    <AnalysisYoyTable
                        data={data.yoyComparison}
                    />
                </div>
            ) : (
                <div className="text-center py-10 text-slate-500">
                    <p className="font-bold text-red-600 mb-2">Veri yüklenemedi</p>
                    <p className="text-sm">{error || "Bilinmeyen bir hata oluştu."}</p>
                </div>
            )}
        </div>
    )
}
