"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { deleteExpense } from "@/app/actions/expenses"
import { useRouter } from "next/navigation"

type ActionDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    dateStr: string
    rowData: any // Contains category keys with expense objects
    onEdit: (expense: any) => void
}

export function ActionDialog({ open, onOpenChange, dateStr, rowData, onEdit }: ActionDialogProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    // Filter available categories for this specific date (where expense exists)
    // rowData keys might be 'categoryName'. Check if value is object with id.
    const availableCategories = Object.keys(rowData).filter(key =>
        key !== 'date' && rowData[key] && typeof rowData[key] === 'object' && rowData[key].id
    )

    const handleEdit = () => {
        if (!selectedCategory) return
        const expense = rowData[selectedCategory]
        onOpenChange(false)
        onEdit(expense)
        setSelectedCategory("")
    }

    const handleDelete = async () => {
        if (!selectedCategory) return
        if (!confirm("Bu gideri silmek istediğinize emin misiniz?")) return

        setLoading(true)
        const expense = rowData[selectedCategory]
        await deleteExpense(expense.id)
        router.refresh()
        setLoading(false)
        onOpenChange(false)
        setSelectedCategory("")
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>İşlem Seçiniz</DialogTitle>
                    <DialogDescription>
                        {dateStr} tarihli işlem yapmak istediğiniz gider türünü seçin.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Gider Türü</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Gider seçiniz" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableCategories.length === 0 ? (
                                    <SelectItem value="empty" disabled>Kayıtlı gider yok</SelectItem>
                                ) : (
                                    availableCategories.map(cat => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat} - {rowData[cat].amountTL} ₺
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-2 mt-4">
                        <Button onClick={handleEdit} disabled={!selectedCategory || loading}>
                            Düzenle
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={!selectedCategory || loading}>
                            Sil
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
