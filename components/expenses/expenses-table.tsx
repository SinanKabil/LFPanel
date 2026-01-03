"use client"

import { useState } from "react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { deleteExpense } from "@/app/actions/expenses"
import { MoreHorizontal, Pencil, Trash2, Maximize2 } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ActionDialog } from "./action-dialog"
import { ExpenseSheet } from "./expense-sheet"

type ExpensesTableProps = {
    expenses: any[]
    categories: any[]
    store: any
    showAll?: boolean
}

export function ExpensesTable({ expenses, categories, store, showAll = false }: ExpensesTableProps) {
    const router = useRouter()
    const [actionDialogOpen, setActionDialogOpen] = useState(false)
    const [selectedRow, setSelectedRow] = useState<any>(null)
    const [sheetOpen, setSheetOpen] = useState(false)
    const [editingExpense, setEditingExpense] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    // 1. Group expenses by Date
    const groupedByDate: Record<string, any> = {}

    if (Array.isArray(expenses)) {
        expenses.forEach(exp => {
            if (!exp.date) return
            try {
                const dateKey = format(new Date(exp.date), "yyyy-MM-dd")
                if (!groupedByDate[dateKey]) {
                    groupedByDate[dateKey] = {
                        date: new Date(exp.date),
                    }
                }
                // Map category name to expense object
                if (exp.category) {
                    groupedByDate[dateKey][exp.category] = exp
                }
            } catch (e) {
                console.error("Invalid expense date:", exp)
            }
        })
    }

    const allSortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a)) // Descending

    // Filter for max 30 days unless showAll is true
    const displayedDates = showAll
        ? allSortedDates
        : allSortedDates.slice(0, 30)

    const handleActionClick = (row: any) => {
        setSelectedRow(row)
        setActionDialogOpen(true)
    }

    const handleEdit = (expense: any) => {
        setEditingExpense(expense)
        setSheetOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Bu gideri silmek istediğinize emin misiniz?")) return
        setLoading(true)
        try {
            await deleteExpense(id)
            router.refresh()
        } catch (error) {
            alert("Silme işlemi başarısız oldu.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-x-auto">
                <Table className="w-full table-auto">
                    <TableHeader>
                        <TableRow className="bg-slate-100 border-b border-slate-200 hover:bg-slate-100">
                            <TableHead className="text-left font-bold text-slate-700 border-r border-slate-200 px-4 py-3 whitespace-nowrap sticky left-0 bg-slate-100 z-10 w-[120px]">
                                Tarih
                            </TableHead>
                            {categories.map(cat => (
                                <TableHead key={cat.id} className="text-right font-bold text-slate-700 border-r border-slate-200 px-4 py-3 whitespace-nowrap min-w-[100px]">
                                    {cat.name}
                                </TableHead>
                            ))}
                            <TableHead className="text-right font-bold text-slate-900 px-4 py-3 whitespace-nowrap min-w-[100px] border-r border-slate-200">
                                TOPLAM
                            </TableHead>
                            <TableHead className="text-center font-bold text-slate-700 px-4 py-3 w-[80px]">
                                İşlem
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRows
                            dates={displayedDates}
                            groupedByDate={groupedByDate}
                            categories={categories}
                            handleEdit={handleEdit}
                            handleDelete={handleDelete}
                            handleActionClick={handleActionClick}
                            loading={loading}
                        />
                    </TableBody>
                </Table>
            </div>

            {selectedRow && (
                <ActionDialog
                    open={actionDialogOpen}
                    onOpenChange={setActionDialogOpen}
                    dateStr={selectedRow.date ? format(new Date(selectedRow.date), "d MMMM yyyy", { locale: tr }) : "-"}
                    rowData={selectedRow}
                    onEdit={handleEdit}
                />
            )}

            <ExpenseSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                categories={categories}
                store={store}
                initialData={editingExpense}
            />
        </>
    )
}

function TableRows({ dates, groupedByDate, categories, handleEdit, handleDelete, handleActionClick, loading }: any) {
    if (dates.length === 0) {
        return (
            <TableRow>
                <TableCell colSpan={categories.length + 3} className="text-center py-8 text-slate-500">
                    Kayıt yok.
                </TableCell>
            </TableRow>
        )
    }

    return dates.map((dateKey: string) => {
        const row = groupedByDate[dateKey]

        // Calculate daily total
        const dailyTotal = categories.reduce((acc: number, cat: any) => {
            const exp = row[cat.name]
            return acc + (exp && exp.amountTL ? exp.amountTL : 0)
        }, 0)

        // Active expenses in this row
        const activeExpenses = categories
            .map((cat: any) => row[cat.name])
            .filter(Boolean)

        return (
            <TableRow key={dateKey} className="border-b border-slate-200 odd:bg-white even:bg-slate-50 hover:bg-slate-100">
                <TableCell className="text-sm font-medium text-slate-900 border-r border-slate-200 px-4 py-3 whitespace-nowrap sticky left-0 bg-inherit z-10 w-[120px]">
                    {format(row.date, "d MMMM yyyy", { locale: tr })}
                </TableCell>

                {categories.map((cat: any) => {
                    const expense = row[cat.name]
                    return (
                        <TableCell key={cat.id} className="text-right text-sm text-slate-700 border-r border-slate-200 px-4 py-3 whitespace-nowrap">
                            {expense ? (
                                <span title={expense.description || ""}>
                                    {expense.amountTL?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                                </span>
                            ) : "-"}
                        </TableCell>
                    )
                })}

                <TableCell className="text-right font-bold text-sm text-slate-900 border-r border-slate-200 px-4 py-3 whitespace-nowrap bg-slate-50">
                    {dailyTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                </TableCell>

                <TableCell className="text-center px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                            onClick={() => activeExpenses.length === 1 ? handleEdit(activeExpenses[0]) : handleActionClick(row)}
                            title="Düzenle"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                            onClick={() => activeExpenses.length === 1 ? handleDelete(activeExpenses[0].id) : handleActionClick(row)}
                            disabled={loading}
                            title="Sil"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </TableCell>
            </TableRow>
        )
    })
}
