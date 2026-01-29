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
    createPosTransaction,
    getLamiaStores,
    createLamiaStore,
    updateLamiaStore,
    deleteLamiaStore,
    getCommissionRates,
    createCommissionRate,
    updateCommissionRate,
    deleteCommissionRate,
    updatePosTransaction
} from "@/app/actions/lamia"
import { useRouter } from "next/navigation"

export function PosSheet({ open, onOpenChange, initialData }: { open: boolean, onOpenChange: (open: boolean) => void, initialData?: any }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Data Sources
    const [stores, setStores] = useState<{ id: string, name: string }[]>([])
    const [rates, setRates] = useState<{ id: string, rate: number, label: string }[]>([])

    // Form State
    const [formData, setFormData] = useState<{
        date: Date
        storeId: string
        amount: number | ""
        commissionRateId: string
        note: string
    }>({
        date: new Date(),
        storeId: "",
        amount: "",
        commissionRateId: "",
        note: ""
    })

    const [isCalendarOpen, setIsCalendarOpen] = useState(false)

    // Management States
    const [isStoreManagerOpen, setIsStoreManagerOpen] = useState(false)
    const [newStoreName, setNewStoreName] = useState("")
    const [editingStoreId, setEditingStoreId] = useState<string | null>(null)
    const [editStoreName, setEditStoreName] = useState("")

    const [isRateManagerOpen, setIsRateManagerOpen] = useState(false)
    const [newRateValue, setNewRateValue] = useState("")
    const [newRateLabel, setNewRateLabel] = useState("")
    const [editingRateId, setEditingRateId] = useState<string | null>(null)
    const [editRateValue, setEditRateValue] = useState("")
    const [editRateLabel, setEditRateLabel] = useState("")

    // Calculated Preview
    const selectedRate = rates.find(r => r.id === formData.commissionRateId)
    const amountVal = Number(formData.amount) || 0
    const rateVal = selectedRate?.rate || 0
    const netVal = amountVal / (1 + rateVal / 100)
    const commissionVal = amountVal - netVal

    // Load Data
    useEffect(() => {
        if (open) {
            refreshData()
            if (initialData) {
                setFormData({
                    date: new Date(initialData.date),
                    storeId: initialData.storeId,
                    amount: initialData.amount,
                    commissionRateId: initialData.commissionRateId,
                    note: initialData.note || ""
                })
            } else {
                setFormData({
                    date: new Date(),
                    storeId: "",
                    amount: "",
                    commissionRateId: "",
                    note: ""
                })
            }
        }
    }, [open, initialData])

    const refreshData = async () => {
        const s = await getLamiaStores()
        if (s.success) setStores(s.data || [])
        const r = await getCommissionRates()
        if (r.success) setRates(r.data || [])
    }

    // --- STORE ACTIONS ---
    const handleAddStore = async () => {
        if (!newStoreName.trim()) return
        const res = await createLamiaStore(newStoreName)
        if (res.success && res.data) {
            setStores(prev => [...prev, res.data!].sort((a, b) => a.name.localeCompare(b.name)))
            setFormData(prev => ({ ...prev, storeId: res.data!.id })) // auto-select
            setNewStoreName("")
        }
    }

    const handleUpdateStore = async (id: string) => {
        if (!editStoreName.trim()) return
        const res = await updateLamiaStore(id, editStoreName)
        if (res.success) {
            setStores(prev => prev.map(s => s.id === id ? { ...s, name: editStoreName } : s))
            setEditingStoreId(null)
        }
    }

    const handleDeleteStore = async (id: string) => {
        if (!confirm("Mağazayı silmek istediğinize emin misiniz?")) return
        const res = await deleteLamiaStore(id)
        if (res.success) {
            setStores(prev => prev.filter(s => s.id !== id))
            if (formData.storeId === id) setFormData(prev => ({ ...prev, storeId: "" }))
        } else {
            alert("Mağaza silinemedi. Bu mağazaya ait işlem kayıtları olabilir.")
        }
    }

    // --- RATE ACTIONS ---
    const handleAddRate = async () => {
        const val = parseFloat(newRateValue.replace(",", "."))
        if (isNaN(val) || !newRateLabel.trim()) return

        const res = await createCommissionRate(val, newRateLabel)
        if (res.success && res.data) {
            setRates(prev => [...prev, res.data!].sort((a, b) => a.rate - b.rate))
            setFormData(prev => ({ ...prev, commissionRateId: res.data!.id })) // auto-select
            setNewRateValue("")
            setNewRateLabel("")
        }
    }

    const handleUpdateRate = async (id: string) => {
        const val = parseFloat(editRateValue.replace(",", "."))
        if (isNaN(val) || !editRateLabel.trim()) return

        const res = await updateCommissionRate(id, val, editRateLabel)
        if (res.success) {
            setRates(prev => prev.map(r => r.id === id ? { ...r, rate: val, label: editRateLabel } : r))
            setEditingRateId(null)
        }
    }

    const handleDeleteRate = async (id: string) => {
        if (!confirm("Komisyon oranını silmek istediğinize emin misiniz?")) return
        const res = await deleteCommissionRate(id)
        if (res.success) {
            setRates(prev => prev.filter(r => r.id !== id))
            if (formData.commissionRateId === id) setFormData(prev => ({ ...prev, commissionRateId: "" }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        if (!formData.storeId || !formData.amount || !formData.commissionRateId) {
            alert("Lütfen zorunlu alanları doldurun")
            setLoading(false)
            return
        }

        let res;
        const payload = {
            date: formData.date,
            storeId: formData.storeId,
            amount: Number(formData.amount),
            commissionRateId: formData.commissionRateId,
            note: formData.note
        }

        if (initialData) {
            res = await updatePosTransaction(initialData.id, payload)
        } else {
            res = await createPosTransaction(payload)
        }

        if (res.success) {
            onOpenChange(false)
            setFormData({
                date: new Date(),
                storeId: "",
                amount: "",
                commissionRateId: "",
                note: ""
            })
            router.refresh()
        } else {
            alert("Hata oluştu")
        }
        setLoading(false)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="bg-white border-l border-slate-200 text-slate-900 sm:max-w-md p-6 overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-slate-900 text-xl font-bold">Yeni Tahsilat Girişi</SheetTitle>
                    <SheetDescription className="text-slate-500">
                        Satış tutarını ve geçerli komisyon oranını belirleyin.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ... (Date section unchanged) ... */}
                    {/* We need to retain the Date section, so I will target specifically the handle functions and the render separate if possible, 
                        but effectively replacing the Header is easy. 
                        Let's tackle the handlers separately to be safe or do a MultiReplace. 
                        MultiReplace is better.
                    */}
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
                        <div className="flex gap-2">
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

                            <Popover open={isStoreManagerOpen} onOpenChange={setIsStoreManagerOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" type="button" className="shrink-0 bg-white border-slate-200 hover:bg-slate-50" title="Mağazaları Yönet">
                                        <Settings className="h-4 w-4 text-slate-600" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 bg-white border-slate-200 p-4 shadow-xl" align="end">
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-slate-900 border-b pb-2">Mağaza Yönetimi</h4>

                                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                            {stores.map(store => (
                                                <div key={store.id} className="flex items-center justify-between text-sm group">
                                                    {editingStoreId === store.id ? (
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <Input
                                                                value={editStoreName}
                                                                onChange={(e) => setEditStoreName(e.target.value)}
                                                                className="h-7 text-xs"
                                                            />
                                                            <Button size="icon" variant="ghost" onClick={() => handleUpdateStore(store.id)} className="h-6 w-6 text-green-600"><Check className="h-3 w-3" /></Button>
                                                            <Button size="icon" variant="ghost" onClick={() => setEditingStoreId(null)} className="h-6 w-6 text-slate-400"><X className="h-3 w-3" /></Button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span className="text-slate-700">{store.name}</span>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => { setEditingStoreId(store.id); setEditStoreName(store.name) }}
                                                                    className="h-6 w-6 text-slate-400 hover:text-blue-600"
                                                                >
                                                                    <Pencil className="h-3 w-3" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => handleDeleteStore(store.id)}
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
                                                value={newStoreName}
                                                onChange={(e) => setNewStoreName(e.target.value)}
                                                className="h-8 text-sm bg-slate-50 border-slate-200"
                                                placeholder="Yeni Mağaza Adı"
                                            />
                                            <Button size="sm" onClick={handleAddStore} className="h-8 bg-orange-600 hover:bg-orange-700 text-white px-3">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                        <Label className="font-semibold text-slate-700">Tutar (TL)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value === "" ? "" : parseFloat(e.target.value) })}
                            className="bg-white border-slate-200 text-slate-900 focus-visible:ring-orange-500 font-medium text-lg"
                            placeholder="0.00"
                        />
                    </div>

                    {/* Commission Rate */}
                    <div className="space-y-2">
                        <Label className="font-semibold text-slate-700">Komisyon Oranı</Label>
                        <div className="flex gap-2">
                            <Select
                                value={formData.commissionRateId}
                                onValueChange={(val) => setFormData({ ...formData, commissionRateId: val })}
                            >
                                <SelectTrigger className="w-full bg-white border-slate-200 text-slate-900 focus:ring-orange-500">
                                    <SelectValue placeholder="Oran Seç" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 text-slate-900">
                                    {rates.map(r => (
                                        <SelectItem key={r.id} value={r.id}>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900">{r.label}</span>
                                                <span className="text-slate-500 text-xs">- %{r.rate}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Popover open={isRateManagerOpen} onOpenChange={setIsRateManagerOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" type="button" className="shrink-0 bg-white border-slate-200 hover:bg-slate-50" title="Komisyon Oranlarını Yönet">
                                        <Settings className="h-4 w-4 text-slate-600" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-96 bg-white border-slate-200 p-4 shadow-xl" align="end">
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-slate-900 border-b pb-2">Komisyon Oranı Yönetimi</h4>

                                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                            {rates.map(rate => (
                                                <div key={rate.id} className="flex items-center justify-between text-sm group p-1.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                                    {editingRateId === rate.id ? (
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <Input value={editRateValue} onChange={e => setEditRateValue(e.target.value)} className="h-6 w-14 text-xs" />
                                                            <Input value={editRateLabel} onChange={e => setEditRateLabel(e.target.value)} className="h-6 flex-1 text-xs" />
                                                            <Button size="icon" variant="ghost" onClick={() => handleUpdateRate(rate.id)} className="h-6 w-6 text-green-600"><Check className="h-3 w-3" /></Button>
                                                            <Button size="icon" variant="ghost" onClick={() => setEditingRateId(null)} className="h-6 w-6 text-slate-400"><X className="h-3 w-3" /></Button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="font-bold text-slate-900 text-sm">%{rate.rate}</span>
                                                                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1 py-0.5 rounded w-fit">{rate.label}</span>
                                                            </div>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => { setEditingRateId(rate.id); setEditRateValue(rate.rate.toString()); setEditRateLabel(rate.label) }}
                                                                    className="h-6 w-6 text-slate-400 hover:text-blue-600 hover:bg-white shadow-sm border border-slate-100"
                                                                >
                                                                    <Pencil className="h-3 w-3" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => handleDeleteRate(rate.id)}
                                                                    className="h-6 w-6 text-slate-400 hover:text-red-600 hover:bg-white shadow-sm border border-slate-100"
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
                                                value={newRateValue}
                                                onChange={(e) => setNewRateValue(e.target.value)}
                                                className="h-8 w-20 text-sm bg-slate-50 border-slate-200"
                                                placeholder="%"
                                            />
                                            <Input
                                                value={newRateLabel}
                                                onChange={(e) => setNewRateLabel(e.target.value)}
                                                className="h-8 flex-1 text-sm bg-slate-50 border-slate-200"
                                                placeholder="Etiket"
                                            />
                                            <Button size="sm" onClick={handleAddRate} className="h-8 bg-orange-600 hover:bg-orange-700 text-white px-3">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Updated Net Calculation Preview with Modern Design */}
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200 shadow-inner">
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-medium">İşlem Tutarı</span>
                                <span className="text-slate-900 font-semibold">{amountVal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-medium">Komisyon ({selectedRate ? `%${selectedRate.rate}` : '-'})</span>
                                <span className="text-red-500 font-semibold">
                                    {commissionVal > 0 ? `-${commissionVal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL` : '-'}
                                </span>
                            </div>

                            <div className="h-px bg-slate-200"></div>

                            <div className="flex justify-between items-center">
                                <span className="text-slate-700 font-bold text-lg">Net Geçen</span>
                                <span className="text-green-600 font-black text-2xl tracking-tight">
                                    {amountVal > 0 ? `${netVal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL` : '0.00 TL'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Note */}
                    <div className="space-y-2">
                        <Label className="font-semibold text-slate-700">Not (İsteğe bağlı)</Label>
                        <Input
                            value={formData.note}
                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            className="bg-white border-slate-200 text-slate-900"
                            placeholder="İşlem ile ilgili not..."
                        />
                    </div>

                    <SheetFooter className="mt-8">
                        <Button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-6 text-lg shadow-orange-200 shadow-lg transition-all hover:scale-[1.02]">
                            {loading ? "Kaydediliyor..." : "Kaydet ve Tamamla"}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}
