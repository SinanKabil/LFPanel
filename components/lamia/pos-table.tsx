"use client"

import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Trash2, Plus, Pencil, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { deletePosTransaction } from "@/app/actions/lamia"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { PosSheet } from "./pos-sheet"
import { Maximize2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

type PosTransaction = {
    id: string
    date: Date | string
    store: { name: string }
    amount: number
    commissionRateSnapshot: number
    commissionRate: { label: string }
    net: number
    note: string | null
    storeId: string
    commissionRateId: string
}

export function PosTable({ transactions }: { transactions: PosTransaction[] }) {
    const router = useRouter()
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [editingTransaction, setEditingTransaction] = useState<PosTransaction | null>(null)

    // Show only last 10 transactions
    const displayTransactions = transactions.slice(0, 10)

    const handleCreate = () => {
        setEditingTransaction(null)
        setIsSheetOpen(true)
    }

    const handleEdit = (tx: PosTransaction) => {
        setEditingTransaction(tx)
        setIsSheetOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Bu işlemi silmek istediğinize emin misiniz?")) return
        await deletePosTransaction(id)
        router.refresh()
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-slate-500" />
                    <h3 className="text-lg font-bold text-slate-900">Pos Cihazı</h3>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-all" title="Tümünü Gör">
                                <Maximize2 className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[100vw] w-[100vw] h-[100vh] flex flex-col p-6 overflow-hidden rounded-none m-0 border-none sm:max-w-[100vw]">
                            <DialogHeader>
                                <DialogTitle>Tüm POS İşlemleri</DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto mt-4 px-1">
                                <Table className="w-full table-auto">
                                    <TableHeader>
                                        <TableRow className="bg-slate-100 border-b border-slate-200 hover:bg-slate-100">
                                            <TableHead className="text-left font-bold text-slate-700 border-r border-slate-200 px-2 py-3 text-xs whitespace-nowrap">Tarih</TableHead>
                                            <TableHead className="text-left font-bold text-slate-700 border-r border-slate-200 px-2 py-3 text-xs whitespace-nowrap">Mağaza</TableHead>
                                            <TableHead className="text-right font-bold text-slate-700 border-r border-slate-200 px-2 py-3 text-xs whitespace-nowrap">Toplam</TableHead>
                                            <TableHead className="text-right font-bold text-slate-700 border-r border-slate-200 px-2 py-3 text-xs whitespace-nowrap">Kom.</TableHead>
                                            <TableHead className="text-right font-bold text-slate-700 border-r border-slate-200 px-2 py-3 text-xs whitespace-nowrap">Net Pos</TableHead>
                                            <TableHead className="text-center font-bold text-slate-700 border-r border-slate-200 px-2 py-3 text-xs whitespace-nowrap">Etiket</TableHead>
                                            <TableHead className="text-center font-bold text-slate-700 px-2 py-3 text-xs whitespace-nowrap">İşlem</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.map((tx) => (
                                            <TableRow key={tx.id} className="border-b border-slate-200 hover:bg-slate-50">
                                                <TableCell className="px-2 py-2 whitespace-nowrap text-xs text-slate-700 border-r border-slate-200 font-normal truncate">
                                                    {format(new Date(tx.date), "dd.MM.yy", { locale: tr })}
                                                </TableCell>
                                                <TableCell className="px-2 py-2 text-xs text-slate-700 border-r border-slate-200 font-normal truncate" title={tx.store?.name || ""}>
                                                    {tx.store?.name || "-"}
                                                </TableCell>
                                                <TableCell className="px-2 py-2 text-right text-xs text-slate-900 border-r border-slate-200 font-bold truncate">
                                                    {Math.round(tx.amount).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                                                </TableCell>
                                                <TableCell className="px-2 py-2 text-right text-xs text-red-600 border-r border-slate-200 truncate">
                                                    {Math.round(tx.amount - tx.net).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                                                </TableCell>
                                                <TableCell className="px-2 py-2 text-right text-xs font-bold text-green-600 border-r border-slate-200 truncate">
                                                    {Math.round(tx.net).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                                                </TableCell>
                                                <TableCell className="px-2 py-2 text-center text-xs text-slate-500 border-r border-slate-200">
                                                    <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium whitespace-nowrap">
                                                        {tx.commissionRate?.label || "-"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-2 py-2 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(tx)}
                                                            className="h-6 w-6 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                                        >
                                                            <Pencil className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(tx.id)}
                                                            className="h-6 w-6 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    <Button onClick={handleCreate} className="h-8 bg-[#000080] hover:bg-[#000060] text-white shadow-md hover:shadow-xl hover:scale-105 transition-all rounded-full px-4 text-xs font-semibold">
                        <Plus className="mr-2 h-3.5 w-3.5" /> Yeni Pos Ekle
                    </Button>
                </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
                <Table className="w-full table-auto">
                    <TableHeader>
                        <TableRow className="bg-slate-100 border-b border-slate-200 hover:bg-slate-100">
                            <TableHead className="text-left font-bold text-slate-700 border-r border-slate-200 px-2 py-3 text-xs whitespace-nowrap">Tarih</TableHead>
                            <TableHead className="text-left font-bold text-slate-700 border-r border-slate-200 px-2 py-3 text-xs whitespace-nowrap">Mağaza</TableHead>
                            <TableHead className="text-right font-bold text-slate-700 border-r border-slate-200 px-2 py-3 text-xs whitespace-nowrap">Toplam</TableHead>
                            <TableHead className="text-right font-bold text-slate-700 border-r border-slate-200 px-2 py-3 text-xs whitespace-nowrap">Kom.</TableHead>
                            <TableHead className="text-right font-bold text-slate-700 border-r border-slate-200 px-2 py-3 text-xs whitespace-nowrap">Net Pos</TableHead>
                            <TableHead className="text-center font-bold text-slate-700 border-r border-slate-200 px-2 py-3 text-xs whitespace-nowrap">Etiket</TableHead>
                            <TableHead className="text-center font-bold text-slate-700 px-2 py-3 text-xs whitespace-nowrap">İşlem</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {displayTransactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                    Henüz işlem yok.
                                </TableCell>
                            </TableRow>
                        ) : (
                            displayTransactions.map((tx) => (
                                <TableRow key={tx.id} className="border-b border-slate-200 hover:bg-slate-50">
                                    <TableCell className="px-2 py-2 whitespace-nowrap text-xs text-slate-700 border-r border-slate-200 font-normal truncate">
                                        {format(new Date(tx.date), "dd.MM.yy", { locale: tr })}
                                    </TableCell>
                                    <TableCell className="px-2 py-2 text-xs text-slate-700 border-r border-slate-200 font-normal truncate" title={tx.store?.name || ""}>
                                        {tx.store?.name || "-"}
                                    </TableCell>
                                    <TableCell className="px-2 py-2 text-right text-xs text-slate-900 border-r border-slate-200 font-bold truncate">
                                        {Math.round(tx.amount).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                                    </TableCell>
                                    <TableCell className="px-2 py-2 text-right text-xs text-red-600 border-r border-slate-200 truncate">
                                        {Math.round(tx.amount - tx.net).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                                    </TableCell>
                                    <TableCell className="px-2 py-2 text-right text-xs font-bold text-green-600 border-r border-slate-200 truncate">
                                        {Math.round(tx.net).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                                    </TableCell>
                                    <TableCell className="px-2 py-2 text-center text-xs text-slate-500 border-r border-slate-200">
                                        <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium whitespace-nowrap">
                                            {tx.commissionRate?.label || "-"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-2 py-2 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(tx)}
                                                className="h-6 w-6 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(tx.id)}
                                                className="h-6 w-6 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <PosSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                initialData={editingTransaction}
            />
        </div>
    )
}
