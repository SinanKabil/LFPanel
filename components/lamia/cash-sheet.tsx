"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { CalendarIcon, Plus, Trash2 } from "lucide-react"
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
    createCashTransaction,
    updateCashTransaction,
    getLamiaStores
} from "@/app/actions/lamia"
import { useRouter } from "next/navigation"

export function CashSheet({ open, onOpenChange, initialData }: { open: boolean, onOpenChange: (open: boolean) => void, initialData?: any }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [stores, setStores] = useState<{ id: string, name: string }[]>([])

    const [formData, setFormData] = useState<{
        date: Date
        storeId: string
        amount: number | ""
        note: string
    }>({
        date: new Date(),
        storeId: "",
        amount: "",
        note: ""
    })

    const [isCalendarOpen, setIsCalendarOpen] = useState(false)

    // Extra amounts state
    const [extraAmounts, setExtraAmounts] = useState<{ id: number, value: string }[]>([])

    useEffect(() => {
        if (open) {
            getLamiaStores().then(res => {
                if (res.success) setStores(res.data || [])
            })
            if (initialData) {
                setFormData({
                    date: new Date(initialData.date),
                    storeId: initialData.storeId,
                    amount: initialData.amount,
                    note: initialData.note || ""
                })
                setExtraAmounts([]) // Reset extra amounts on edit (since we only stored total)
            } else {
                setFormData({
                    date: new Date(),
                    storeId: "",
                    amount: "",
                    note: ""
                })
                setExtraAmounts([])
            }
        }
    }, [open, initialData])

    const handleAddAmount = () => {
        setExtraAmounts([...extraAmounts, { id: Date.now(), value: "" }])
    }

    const handleRemoveAmount = (id: number) => {
        setExtraAmounts(extraAmounts.filter(item => item.id !== id))
    }

    const handleExtraAmountChange = (id: number, val: string) => {
        setExtraAmounts(extraAmounts.map(item => item.id === id ? { ...item, value: val } : item))
    }

    // Calculate total
    const mainAmount = formData.amount === "" ? 0 : Number(formData.amount)
    const extraTotal = extraAmounts.reduce((acc, curr) => acc + (curr.value === "" ? 0 : Number(curr.value)), 0)
    const totalAmount = mainAmount + extraTotal

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        if (!formData.storeId || totalAmount <= 0) {
            alert("Mağaza seçilmeli ve Toplam Tutar 0'dan büyük olmalıdır")
            setLoading(false)
            return
        }

        let res;
        const payload = {
            date: formData.date,
            amount: totalAmount, // Send the calculated sum
            storeId: formData.storeId,
            note: formData.note
        }

        if (initialData) {
            res = await updateCashTransaction(initialData.id, payload)
        } else {
            res = await createCashTransaction(payload)
        }

        if (res.success) {
            onOpenChange(false)
            router.refresh()
        } else {
            alert("Hata oluştu")
        }
        setLoading(false)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="bg-white border-l border-slate-200 text-slate-900 sm:max-w-md p-6 overflow-y-auto w-full">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-slate-900 text-xl font-bold">
                        {initialData ? "Nakit İşlemi Düzenle" : "Yeni Nakit İşlemi"}
                    </SheetTitle>
                    <SheetDescription className="text-slate-500">
                        Nakit gelir detaylarını girin.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Date */}
                    <div className="space-y-2">
                        <Label className="font-semibold text-slate-700">Tarih</Label>
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal bg-white border-slate-200 text-slate-900 hover:bg-slate-50 focus-visible:ring-orange-500",
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

                    {/* Store */}
                    <div className="space-y-2">
                        <Label className="font-semibold text-slate-700">Mağaza</Label>
                        <Select
                            value={formData.storeId}
                            onValueChange={(val) => setFormData({ ...formData, storeId: val })}
                        >
                            <SelectTrigger className="w-full bg-white border-slate-200 text-slate-900 focus:ring-orange-500">
                                <SelectValue placeholder="Mağaza Seç" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-200 text-slate-900">
                                {stores.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Amount Section */}
                    <div className="space-y-3">
                        <Label className="font-semibold text-slate-700">Tutar (TL)</Label>

                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value === "" ? "" : parseFloat(e.target.value) })}
                                className="bg-white border-slate-200 text-slate-900 focus-visible:ring-orange-500 font-medium text-lg"
                                placeholder="0.00"
                            />
                            <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={handleAddAmount}
                                className="shrink-0 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                                title="Ek tutar ekle"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {extraAmounts.map((item, index) => (
                            <div key={item.id} className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">+</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={item.value}
                                        onChange={(e) => handleExtraAmountChange(item.id, e.target.value)}
                                        className="bg-white border-slate-200 text-slate-900 focus-visible:ring-orange-500 pl-7"
                                        placeholder="Ek tutar"
                                        autoFocus
                                    />
                                </div>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleRemoveAmount(item.id)}
                                    className="shrink-0 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}

                        {extraAmounts.length > 0 && (
                            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-sm font-medium">
                                <span className="text-slate-500">Toplam Tutar:</span>
                                <span className="text-orange-600 text-lg">
                                    {totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Note */}
                    <div className="space-y-2">
                        <Label className="font-semibold text-slate-700">Not (İsteğe bağlı)</Label>
                        <Input
                            value={formData.note}
                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            className="bg-white border-slate-200 text-slate-900"
                            placeholder="İşlem notu..."
                        />
                    </div>

                    <SheetFooter className="mt-8">
                        <Button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-6 text-lg shadow-orange-200 shadow-lg transition-all hover:scale-[1.02]">
                            {loading ? "Kaydediliyor..." : "Kaydet"}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}
