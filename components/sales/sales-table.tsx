"use client"

import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Pencil, Trash2 } from "lucide-react"
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
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteSale } from "@/app/actions/sales"
import { cn } from "@/lib/utils"

// Simplified Props for Display
interface SalesTableProps {
    sales: any[]
    onEdit: (sale: any) => void
}

export function SalesTable({ sales, onEdit }: SalesTableProps) {
    const handleDelete = async (id: string) => {
        if (!confirm("Bu satışı silmek istediğinize emin misiniz?")) return
        await deleteSale(id)
        window.location.reload()
    }

    return (
        <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-100 border-b border-slate-200 hover:bg-slate-100">
                        <TableHead className="text-left font-bold text-slate-700 border-r border-slate-200 whitespace-nowrap px-4 py-3">Tarih</TableHead>
                        <TableHead className="text-left font-bold text-slate-700 border-r border-slate-200 whitespace-nowrap px-4 py-3">Sipariş No</TableHead>
                        <TableHead className="text-left font-bold text-slate-700 border-r border-slate-200 whitespace-nowrap px-4 py-3">Mağaza</TableHead>
                        <TableHead className="text-left font-bold text-slate-700 border-r border-slate-200 whitespace-nowrap px-4 py-3">Ürün</TableHead>
                        <TableHead className="text-left font-bold text-slate-700 border-r border-slate-200 whitespace-nowrap px-4 py-3">Adet</TableHead>
                        <TableHead className="text-left font-bold text-slate-700 border-r border-slate-200 whitespace-nowrap px-4 py-3">Tutar</TableHead>
                        <TableHead className="text-left font-bold text-slate-700 border-r border-slate-200 whitespace-nowrap px-4 py-3">Kesintiler</TableHead>
                        <TableHead className="text-left font-bold text-slate-700 border-r border-slate-200 whitespace-nowrap px-4 py-3">Maliyet</TableHead>
                        <TableHead className="text-left font-bold text-slate-700 border-r border-slate-200 whitespace-nowrap px-4 py-3">Kargo ($)</TableHead>
                        <TableHead className="text-left font-bold text-slate-700 border-r border-slate-200 whitespace-nowrap px-4 py-3">İndirim (%)</TableHead>
                        <TableHead className="text-left font-bold text-slate-700 border-r border-slate-200 whitespace-nowrap px-4 py-3">Kar ($)</TableHead>
                        <TableHead className="text-left font-bold text-slate-700 border-r border-slate-200 whitespace-nowrap px-4 py-3">Kar (TL)</TableHead>
                        <TableHead className="text-left font-bold text-slate-700 whitespace-nowrap px-4 py-3 w-[100px]">İşlemler</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sales.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={13} className="text-center py-8 text-slate-500 border-r border-slate-200 last:border-r-0">
                                Bu dönem için satış bulunamadı.
                            </TableCell>
                        </TableRow>
                    ) : (
                        sales.map((sale) => (
                            <TableRow key={sale.id} className="border-b border-slate-200 hover:bg-slate-50">
                                <TableCell className="whitespace-nowrap text-sm text-slate-700 font-normal border-r border-slate-200 px-4 py-3">
                                    {format(new Date(sale.date), "d MMM yyyy", { locale: tr })}
                                </TableCell>
                                <TableCell className="text-sm text-slate-700 font-normal border-r border-slate-200 px-4 py-3">
                                    {sale.orderNo}
                                </TableCell>
                                <TableCell className="text-sm text-slate-700 font-normal border-r border-slate-200 px-4 py-3">
                                    {sale.store === "RADIANT_JEWELRY_GIFT" ? "Radiant Jewelry Gift" :
                                        sale.store === "THE_TRENDY_OUTFITTERS" ? "The Trendy Outfitters" :
                                            "Lamiaferis"}
                                </TableCell>
                                <TableCell className="text-sm text-slate-700 font-normal border-r border-slate-200 px-4 py-3 max-w-[200px] truncate" title={sale.product?.name}>
                                    {sale.product?.name}
                                </TableCell>
                                <TableCell className="text-sm text-slate-700 font-normal border-r border-slate-200 px-4 py-3">
                                    {sale.quantity}
                                </TableCell>
                                <TableCell className="text-sm text-slate-700 font-normal border-r border-slate-200 px-4 py-3">
                                    ${sale.buyerPaid.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-sm text-slate-700 font-normal border-r border-slate-200 px-4 py-3">
                                    -${sale.feesCredits.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-sm text-slate-700 font-normal border-r border-slate-200 px-4 py-3">
                                    -${sale.productCost.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-sm text-slate-700 font-normal border-r border-slate-200 px-4 py-3">
                                    -${sale.shippingCost.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-sm text-slate-700 font-normal border-r border-slate-200 px-4 py-3">
                                    {sale.discountRate ? `%${sale.discountRate}` : "-"}
                                </TableCell>
                                <TableCell className={cn(
                                    "text-sm font-bold border-r border-slate-200 px-4 py-3",
                                    sale.profitUSD >= 0 ? "text-green-600" : "text-red-600"
                                )}>
                                    ${sale.profitUSD.toFixed(2)}
                                </TableCell>
                                <TableCell className={cn(
                                    "text-sm font-bold border-r border-slate-200 px-4 py-3",
                                    sale.profitTL >= 0 ? "text-green-600" : "text-red-600"
                                )}>
                                    ₺{sale.profitTL.toFixed(2)}
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(sale)}
                                            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(sale.id)}
                                            className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
