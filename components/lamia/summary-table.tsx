"use client"

import { useState } from "react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Maximize2, X, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from "@/components/ui/dialog"

type SummaryTableProps = {
    posTransactions: any[]
    cashTransactions: any[]
    stores: any[]
}

export function SummaryTable({ posTransactions, cashTransactions, stores }: SummaryTableProps) {
    // 1. Calculate Total Revenue per Store (across all displayed dates)
    const storeRevenues = stores.map(store => {
        const posRevenue = posTransactions
            .filter(t => t.storeId === store.id)
            .reduce((acc, curr) => acc + curr.net, 0)

        const cashRevenue = cashTransactions
            .filter(t => t.storeId === store.id)
            .reduce((acc, curr) => acc + curr.amount, 0)

        const revenue = posRevenue + cashRevenue
        return { ...store, revenue }
    })

    // 2. Sort by Revenue Descending
    const sortedStores = [...storeRevenues].sort((a, b) => b.revenue - a.revenue)

    // 3. Get Top 5
    const top5Stores = sortedStores.slice(0, 5)

    // 4. Prepare Row Generator
    const generateRows = (targetStores: typeof stores) => {
        const allDates = new Set<string>()
        posTransactions.forEach(t => allDates.add(format(new Date(t.date), "yyyy-MM-dd")))
        cashTransactions.forEach(t => allDates.add(format(new Date(t.date), "yyyy-MM-dd")))

        const sortedDates = Array.from(allDates).sort((a, b) => b.localeCompare(a))

        return sortedDates.map(dateStr => {
            const rowDate = new Date(dateStr)
            const rowData: any = { date: rowDate, total: 0 }

            targetStores.forEach((store: any) => {
                const posSum = posTransactions
                    .filter(t =>
                        format(new Date(t.date), "yyyy-MM-dd") === dateStr &&
                        t.storeId === store.id
                    )
                    .reduce((acc, curr) => acc + curr.net, 0)

                const cashSum = cashTransactions
                    .filter(t =>
                        format(new Date(t.date), "yyyy-MM-dd") === dateStr &&
                        t.storeId === store.id
                    )
                    .reduce((acc, curr) => acc + curr.amount, 0)

                const totalStore = posSum + cashSum
                rowData[store.id] = totalStore
                rowData.total += totalStore
            })

            return rowData
        })
    }

    const top5Rows = generateRows(top5Stores).slice(0, 30)
    const allRows = generateRows(sortedStores) // All stores, sorted by revenue

    const TableContent = ({ rows, columns }: { rows: any[], columns: any[] }) => (
        <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-100 border-b border-slate-200 hover:bg-slate-100">
                        <TableHead className="text-left font-bold text-slate-700 whitespace-nowrap border-r border-slate-200 px-4 py-3 sticky left-0 bg-slate-100 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Tarih</TableHead>
                        {columns.map(store => (
                            <TableHead key={store.id} className="text-right font-bold text-slate-700 whitespace-nowrap border-r border-slate-200 px-4 py-3 min-w-[120px]">
                                {store.name}
                            </TableHead>
                        ))}
                        <TableHead className="text-right font-bold text-slate-900 whitespace-nowrap px-4 py-3 bg-slate-200/50 sticky right-0 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">TOPLAM</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length + 2} className="text-center py-8 text-slate-500">
                                Kayıt bulunamadı.
                            </TableCell>
                        </TableRow>
                    ) : (
                        rows.map((row, idx) => (
                            <TableRow key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                                <TableCell className="font-normal text-sm text-slate-700 whitespace-nowrap border-r border-slate-200 px-4 py-3 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] text-left">
                                    {format(row.date, "d MMM yyyy", { locale: tr })}
                                </TableCell>
                                {columns.map(store => (
                                    <TableCell key={store.id} className="text-right text-sm text-slate-700 border-r border-slate-200 px-4 py-3 font-normal">
                                        {(row[store.id] || 0) > 0
                                            ? <span>{Math.round(row[store.id]).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}</span>
                                            : "-"
                                        }
                                    </TableCell>
                                ))}
                                <TableCell className="text-right font-bold text-sm text-slate-900 px-4 py-3 bg-slate-50 sticky right-0 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                    {Math.round(row.total).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-slate-500" />
                    <h3 className="text-lg font-bold text-slate-900">Günlük Özet</h3>
                </div>
                <div className="flex items-center">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-all" title="Tümünü Gör">
                                <Maximize2 className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[100vw] w-[100vw] h-[100vh] flex flex-col p-6 overflow-hidden rounded-none m-0 border-none sm:max-w-[100vw]">
                            <DialogHeader className="flex-shrink-0 flex flex-row items-center justify-between">
                                <DialogTitle className="text-xl font-bold text-slate-900">Tüm Mağazalar - Günlük Özet</DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto mt-4 px-1">
                                <TableContent rows={allRows} columns={sortedStores} />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <TableContent rows={top5Rows} columns={top5Stores} />
        </div>
    )
}
