"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarRange } from "lucide-react"

type Props = {
    monthlySummary: {
        month: string
        income: number
        expense: number
        profit: number
    }[]
}

export function AnalysisMonthlyTable({ monthlySummary }: Props) {
    const formatCurrency = (val: number) =>
        val.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })

    // Reverse the summary to show newest dates first (assuming it comes sorted ascending from backend)
    const reversedSummary = [...monthlySummary].reverse()

    const totalIncome = monthlySummary.reduce((acc, curr) => acc + curr.income, 0)
    const totalExpense = monthlySummary.reduce((acc, curr) => acc + curr.expense, 0)
    const totalProfit = monthlySummary.reduce((acc, curr) => acc + curr.profit, 0)

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <CalendarRange className="h-5 w-5 text-slate-600" />
                    Aylık Gelir / Gider Özeti
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border border-slate-200 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="font-bold text-slate-700">Ay</TableHead>
                                <TableHead className="text-right font-bold text-slate-700">Toplam Gelir</TableHead>
                                <TableHead className="text-right font-bold text-slate-700">Toplam Gider</TableHead>
                                <TableHead className="text-right font-bold text-slate-700">Net Kar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {monthlySummary.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-6 text-slate-500">
                                        Veri bulunamadı.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <>
                                    {reversedSummary.map((item, idx) => (
                                        <TableRow key={idx} className="hover:bg-slate-50">
                                            <TableCell className="font-medium text-slate-900 capitalize">{item.month}</TableCell>
                                            <TableCell className="text-right text-emerald-600 font-semibold">{formatCurrency(item.income)}</TableCell>
                                            <TableCell className="text-right text-red-600 font-semibold">{formatCurrency(item.expense)}</TableCell>
                                            <TableCell className={`text-right font-bold ${item.profit >= 0 ? 'text-blue-600' : 'text-red-700'}`}>
                                                {formatCurrency(item.profit)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Grand Total Row */}
                                    <TableRow className="bg-slate-100 font-bold border-t-2 border-slate-200">
                                        <TableCell>GENEL TOPLAM</TableCell>
                                        <TableCell className="text-right text-emerald-700">{formatCurrency(totalIncome)}</TableCell>
                                        <TableCell className="text-right text-red-700">{formatCurrency(totalExpense)}</TableCell>
                                        <TableCell className={`text-right ${totalProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                                            {formatCurrency(totalProfit)}
                                        </TableCell>
                                    </TableRow>
                                </>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
