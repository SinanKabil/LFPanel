"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { CalendarIcon, Plus, Settings, Trash2, Pencil, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
    createExpense,
    updateExpense,
    getExpenseCategories,
    createExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory
} from "@/app/actions/expenses"
import { Store } from "@prisma/client"

export type ExpenseFormValues = {
    id?: string
    date: Date
    category: string
    store: Store
    amountTL: number | ""
    amountUSD: number | ""
    exchangeRate: number | ""
    description: string
}

interface ExpensesSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData?: ExpenseFormValues | null
}

export function ExpensesSheet({ open, onOpenChange, initialData }: ExpensesSheetProps) {
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([])
    const [newCategoryName, setNewCategoryName] = useState("")
    const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false)
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)

    // Category Management
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
    const [editCategoryName, setEditCategoryName] = useState("")

    const [formData, setFormData] = useState<ExpenseFormValues>({
        date: new Date(),
        category: "",
        store: "RADIANT_JEWELRY_GIFT",
        amountTL: "",
        amountUSD: "",
        exchangeRate: "",
        description: "",
    })

    // Fetch categories on mount and when sheet opens
    useEffect(() => {
        if (open) {
            getExpenseCategories().then(res => {
                if (res.success && res.data) {
                    setCategories(res.data)
                }
            })
        }
    }, [open])

    useEffect(() => {
        if (open) {
            if (initialData) {
                setFormData({
                    ...initialData,
                    date: new Date(initialData.date),
                    amountTL: initialData.amountTL || "",
                    amountUSD: initialData.amountUSD || "",
                    exchangeRate: initialData.exchangeRate || "",
                })
            } else {
                setFormData({
                    date: new Date(),
                    category: "",
                    store: "RADIANT_JEWELRY_GIFT",
                    amountTL: "",
                    amountUSD: "",
                    exchangeRate: "",
                    description: "",
                })
            }
        }
    }, [open, initialData])

    // Auto-calculate exchange rate
    useEffect(() => {
        const tl = Number(formData.amountTL)
        const usd = Number(formData.amountUSD)
        if (tl > 0 && usd > 0) {
            setFormData(prev => ({ ...prev, exchangeRate: tl / usd }))
        }
    }, [formData.amountTL, formData.amountUSD])

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return
        const res = await createExpenseCategory(newCategoryName)
        if (res.success && res.data) {
            setCategories(prev => [...prev, res.data!].sort((a, b) => a.name.localeCompare(b.name)))
            setFormData(prev => ({ ...prev, category: res.data!.name }))
            setNewCategoryName("")
        } else {
            alert(res.error || "Kategori oluşturulamadı")
        }
    }

    const handleUpdateCategory = async (id: string) => {
        if (!editCategoryName.trim()) return
        const res = await updateExpenseCategory(id, editCategoryName)
        if (res.success) {
            setCategories(prev => prev.map(c => c.id === id ? { ...c, name: editCategoryName } : c))
            setEditingCategoryId(null)
            // Update selected category if it was this one
            if (formData.category === categories.find(c => c.id === id)?.name) {
                setFormData(prev => ({ ...prev, category: editCategoryName }))
            }
        }
    }

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("Kategoriyi silmek istediğinize emin misiniz?")) return
        const res = await deleteExpenseCategory(id)
        if (res.success) {
            setCategories(prev => prev.filter(c => c.id !== id))
            if (formData.category === categories.find(c => c.id === id)?.name) {
                setFormData(prev => ({ ...prev, category: "" }))
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Validation: At least one amount
        if (!formData.amountTL && !formData.amountUSD) {
            alert("Lütfen en az bir tutar (TL veya USD) giriniz.")
            setLoading(false)
            return
        }

        const payload: any = {
            ...formData,
            amountTL: formData.amountTL === "" ? 0 : Number(formData.amountTL),
            amountUSD: formData.amountUSD === "" ? 0 : Number(formData.amountUSD),
            exchangeRate: formData.exchangeRate === "" ? 0 : Number(formData.exchangeRate)
        }

        try {
            if (initialData?.id) {
                await updateExpense(initialData.id, payload)
            } else {
                await createExpense(payload)
            }
            onOpenChange(false)
            window.location.reload()
        } catch (error) {
            alert("Bir hata oluştu")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="bg-white border-l border-slate-200 text-slate-900 sm:max-w-md p-6 overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-slate-900 text-xl">{initialData ? "Gider Düzenle" : "Gider Oluştur"}</SheetTitle>
                    <SheetDescription className="text-slate-500">
                        Yeni bir gider kaydı ekleyin veya düzenleyin.
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="space-y-5">

                    <div className="space-y-2">
                        <Label>Tarih</Label>
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal bg-white border-slate-200 text-slate-900 hover:bg-slate-50",
                                        !formData.date && "text-muted-foreground"
                                    )}
                                >
                                    {formData.date ? format(formData.date, "d MMMM yyyy", { locale: tr }) : <span>Tarih seçin</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-white border-slate-200 shadow-md" align="start">
                                <Calendar
                                    mode="single"
                                    selected={formData.date}
                                    onSelect={(d) => {
                                        if (d) {
                                            setFormData({ ...formData, date: d })
                                            setIsCalendarOpen(false)
                                        }
                                    }}
                                    className="text-slate-900 bg-white"
                                    locale={tr}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label>Mağaza</Label>
                        <Select
                            value={formData.store}
                            onValueChange={(value) => setFormData({ ...formData, store: value as Store })}
                        >
                            <SelectTrigger className="w-full bg-white border-slate-200 text-slate-900">
                                <SelectValue placeholder="Mağaza Seç" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-200 text-slate-900">
                                <SelectItem value="RADIANT_JEWELRY_GIFT">Radiant Jewelry Gift</SelectItem>
                                <SelectItem value="THE_TRENDY_OUTFITTERS">The Trendy Outfitters</SelectItem>
                                <SelectItem value="LAMIAFERIS">Lamiaferis</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Kategori</Label>
                        <div className="flex gap-2">
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                                <SelectTrigger className="w-full bg-white border-slate-200 text-slate-900">
                                    <SelectValue placeholder="Kategori Seç" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 text-slate-900">
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Popover open={isCategoryPopoverOpen} onOpenChange={setIsCategoryPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" type="button" className="shrink-0 bg-white border-slate-200 hover:bg-slate-50" title="Kategori Yönetimi">
                                        <Settings className="h-4 w-4 text-slate-600" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 bg-white border-slate-200 p-4 shadow-xl" align="end">
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-slate-900 border-b pb-2">Kategori Yönetimi</h4>

                                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                            {categories.map(cat => (
                                                <div key={cat.id} className="flex items-center justify-between text-sm group p-1.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                                    {editingCategoryId === cat.id ? (
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <Input
                                                                value={editCategoryName}
                                                                onChange={(e) => setEditCategoryName(e.target.value)}
                                                                className="h-7 text-xs"
                                                                autoFocus
                                                            />
                                                            <Button size="icon" variant="ghost" onClick={() => handleUpdateCategory(cat.id)} className="h-6 w-6 text-green-600"><Check className="h-3 w-3" /></Button>
                                                            <Button size="icon" variant="ghost" onClick={() => setEditingCategoryId(null)} className="h-6 w-6 text-slate-400"><X className="h-3 w-3" /></Button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span className="text-slate-700">{cat.name}</span>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => { setEditingCategoryId(cat.id); setEditCategoryName(cat.name) }}
                                                                    className="h-6 w-6 text-slate-400 hover:text-blue-600"
                                                                >
                                                                    <Pencil className="h-3 w-3" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => handleDeleteCategory(cat.id)}
                                                                    className="h-6 w-6 text-slate-400 hover:text-red-600"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex gap-2 pt-2 border-t">
                                            <Input
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                className="h-8 text-sm bg-slate-50 border-slate-200"
                                                placeholder="Yeni Kategori"
                                            />
                                            <Button size="sm" onClick={handleAddCategory} className="h-8 bg-orange-600 hover:bg-orange-700 text-white px-3">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tutar (TL)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.amountTL}
                                onChange={(e) => setFormData({ ...formData, amountTL: e.target.value === "" ? "" : parseFloat(e.target.value) })}
                                className="bg-white border-slate-200 text-slate-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tutar ($)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.amountUSD}
                                onChange={(e) => setFormData({ ...formData, amountUSD: e.target.value === "" ? "" : parseFloat(e.target.value) })}
                                className="bg-white border-slate-200 text-slate-900"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Hesaplanan Kur (TL/USD)</Label>
                        <Input
                            type="number"
                            step="0.0001"
                            placeholder="Otomatik hesaplanır"
                            value={formData.exchangeRate}
                            readOnly
                            disabled
                            className="bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Açıklama (İsteğe Bağlı)</Label>
                        <Input
                            placeholder="Not ekleyin..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="bg-white border-slate-200 text-slate-900"
                        />
                    </div>

                    <SheetFooter className="mt-6">
                        <Button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-6 text-lg">
                            {loading ? "Kaydediliyor..." : "Kaydet"}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}
