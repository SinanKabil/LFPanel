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

type Props = {
    summary: any[]
}

export function AnalysisSummaryTable({ summary }: Props) {
    const formatCurrency = (val: number) =>
        val.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })
    const sortingSummary = [...summary].sort((a, b) => b.turnover - a.turnover)

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800">Mağaza Performans Özeti</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border border-slate-200 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="font-bold text-slate-700">Mağaza</TableHead>
                                <TableHead className="text-right font-bold text-slate-700">Toplam Ciro</TableHead>
                                <TableHead className="text-right font-bold text-slate-700">Ort. Günlük</TableHead>
                                <TableHead className="text-right font-bold text-slate-700">Aktif Gün</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {summary.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-6 text-slate-500">
                                        Veri bulunamadı.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                summary.map(item => (
                                    <TableRow key={item.id} className="hover:bg-slate-50">
                                        <TableCell className="font-medium text-slate-900">{item.name}</TableCell>
                                        <TableCell className="text-right text-emerald-600 font-semibold">{formatCurrency(item.turnover)}</TableCell>
                                        <TableCell className="text-right text-slate-600">{formatCurrency(item.avg)}</TableCell>
                                        <TableCell className="text-right text-slate-600">{item.activeDays}</TableCell>
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
