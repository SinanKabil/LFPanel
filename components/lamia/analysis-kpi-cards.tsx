"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon, Wallet, TrendingUp, TrendingDown, Building2, Receipt, Scale } from "lucide-react"

type KpiData = {
    totalIncome: number
    totalExpense: number
    profit: number
}

type Props = {
    kpis: KpiData
    storeKpis: { name: string, total: number }[]
    expenseKpis: { name: string, total: number }[]
}

export function AnalysisKpiCards({ kpis, storeKpis, expenseKpis }: Props) {
    const formatCurrency = (val: number) =>
        val.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })

    return (
        <div className="space-y-6">
            {/* Top Level KPIs - Compact Modern Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-white rounded-xl p-6 border border-slate-100 border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Toplam Gelir</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{formatCurrency(kpis.totalIncome)}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-full">
                        <TrendingUp className="h-8 w-8 text-emerald-600 opacity-90" />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-slate-100 border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Toplam Gider</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{formatCurrency(kpis.totalExpense)}</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-full">
                        <TrendingDown className="h-8 w-8 text-red-600 opacity-90" />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-slate-100 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Net Kar</p>
                        <p className={`text-3xl font-bold mt-2 ${kpis.profit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                            {formatCurrency(kpis.profit)}
                        </p>
                    </div>
                    <div className={`p-3 rounded-full ${kpis.profit >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                        <Scale className={`h-8 w-8 opacity-90 ${kpis.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
                    </div>
                </div>
            </div>

            {/* Store Breakdown Grid - Modern Badge Style */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1 py-2">
                    <Building2 className="h-3.5 w-3.5" />
                    Mağaza Gelirleri
                </h3>
                <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {storeKpis.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group cursor-default">
                            <div className="flex items-center gap-2 mb-2 border-b border-slate-50 pb-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-200"></span>
                                <span className="text-xs font-bold text-slate-500 uppercase truncate leading-none tracking-wide" title={item.name}>
                                    {item.name}
                                </span>
                            </div>
                            <div className="text-lg font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">
                                {formatCurrency(item.total)}
                            </div>
                        </div>
                    ))}
                    {storeKpis.length === 0 && <p className="text-xs text-slate-500 col-span-full px-1">Veri yok</p>}
                </div>
            </div>

            {/* Expense Breakdown Grid */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
                    <Receipt className="h-3.5 w-3.5" />
                    Gider Dağılımı
                </h3>
                <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {expenseKpis.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md hover:border-red-200 transition-all group cursor-default">
                            <div className="flex items-center gap-2 mb-2 border-b border-slate-50 pb-2">
                                <span className="w-2 h-2 rounded-full bg-red-400 shadow-sm shadow-red-200"></span>
                                <span className="text-xs font-bold text-slate-500 uppercase truncate leading-none tracking-wide" title={item.name}>
                                    {item.name}
                                </span>
                            </div>
                            <div className="text-lg font-bold text-slate-700 group-hover:text-red-700 transition-colors">
                                {formatCurrency(item.total)}
                            </div>
                        </div>
                    ))}
                    {expenseKpis.length === 0 && <p className="text-xs text-slate-500 col-span-full px-1">Veri yok</p>}
                </div>
            </div>
        </div>
    )
}
