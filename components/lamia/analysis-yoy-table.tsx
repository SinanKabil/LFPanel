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
import { History } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
    data: {
        id: string
        name: string
        currentTurnover: number
        currentAvg: number
        prevTurnover: number
        prevAvg: number
    }[]
}

export function AnalysisYoyTable({ data }: Props) {
    const formatCurrency = (val: number) =>
        val.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })

    const formatPercent = (current: number, prev: number) => {
        if (prev === 0) return current > 0 ? "+100%" : "0%"
        const change = ((current - prev) / prev) * 100
        return (
            <span className={cn(
                "font-bold",
                change > 0 ? "text-emerald-600" : change < 0 ? "text-red-500" : "text-slate-500"
            )}>
                {change > 0 ? "+" : ""}{change.toFixed(1)}%
            </span>
        )
    }

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <History className="h-5 w-5 text-purple-600" />
                    Geçen Yıl Karşılaştırması (Aynı Dönem)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border border-slate-200 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="font-bold text-slate-700">Mağaza</TableHead>
                                <TableHead className="text-right font-bold text-slate-700 text-xs sm:text-sm">Bu Yıl Ciro</TableHead>
                                <TableHead className="text-right font-bold text-slate-500 text-xs sm:text-sm">Geçen Yıl</TableHead>
                                <TableHead className="text-right font-bold text-slate-700">Değişim</TableHead>
                                <TableHead className="text-right font-bold text-slate-700 text-xs hidden sm:table-cell">Bu Yıl Ort.</TableHead>
                                <TableHead className="text-right font-bold text-slate-500 text-xs hidden sm:table-cell">Geçen Yıl Ort.</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-6 text-slate-500">
                                        Veri bulunamadı.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-slate-50">
                                        <TableCell className="font-medium text-slate-900">{item.name}</TableCell>
                                        <TableCell className="text-right font-bold text-slate-800">{formatCurrency(item.currentTurnover)}</TableCell>
                                        <TableCell className="text-right text-slate-500 text-sm">{formatCurrency(item.prevTurnover)}</TableCell>
                                        <TableCell className="text-right">{formatPercent(item.currentTurnover, item.prevTurnover)}</TableCell>
                                        <TableCell className="text-right text-slate-600 text-sm hidden sm:table-cell">{formatCurrency(item.currentAvg)}</TableCell>
                                        <TableCell className="text-right text-slate-400 text-sm hidden sm:table-cell">{formatCurrency(item.prevAvg)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
