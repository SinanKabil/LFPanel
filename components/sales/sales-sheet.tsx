"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { CalendarIcon, Save, Check, ChevronsUpDown } from "lucide-react"
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import { createSale, updateSale, SaleFormData } from "@/app/actions/sales"

type Product = {
    id: string
    name: string
    costUSD: number
    productId: string // Added to match potential incoming data structure if needed, but mainly id is used
}

// Define the Sale type that matches our form needs
export type SaleFormValues = {
    id?: string
    store: string // Assuming Store is a string enum or type, keeping as string for now
    type: string // Assuming SaleType is a string enum or type, keeping as string for now
    productId: string
    quantity: number
    date: Date
    orderNo: string
    buyerPaid: number | ""
    feesCredits: number | ""
    tax: number | ""
    totalSalePriceTL: number | ""
    productCost: number | ""
    shippingCost: number | ""
    discountRate: number | ""
}

const defaultSettings: SaleFormValues = {
    store: "RADIANT_JEWELRY_GIFT",
    type: "ORGANIC",
    productId: "",
    quantity: 1,
    date: new Date(),
    orderNo: "",
    buyerPaid: "",
    feesCredits: "",
    tax: "",
    totalSalePriceTL: "",
    productCost: "",
    shippingCost: "",
    discountRate: "",
}

interface SalesSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData?: SaleFormValues | null
    products: any[]
}

export function SalesSheet({ open, onOpenChange, initialData, products }: SalesSheetProps) {
    const [loading, setLoading] = useState(false)
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)
    const [isProductOpen, setIsProductOpen] = useState(false)

    const [formData, setFormData] = useState<SaleFormValues>(defaultSettings)

    useEffect(() => {
        if (open) {
            if (initialData) {
                setFormData({
                    id: initialData.id,
                    store: initialData.store,
                    type: initialData.type,
                    productId: initialData.productId,
                    quantity: initialData.quantity,
                    date: new Date(initialData.date),
                    orderNo: initialData.orderNo,
                    buyerPaid: initialData.buyerPaid,
                    feesCredits: initialData.feesCredits,
                    tax: initialData.tax || "",
                    totalSalePriceTL: initialData.totalSalePriceTL,
                    productCost: initialData.productCost,
                    shippingCost: initialData.shippingCost,
                    discountRate: initialData.discountRate || "",
                })
            } else {
                setFormData({
                    store: "RADIANT_JEWELRY_GIFT",
                    type: "ORGANIC",
                    productId: products.length > 0 ? products[0].id : "",
                    quantity: 1,
                    date: new Date(),
                    orderNo: "",
                    buyerPaid: "",
                    feesCredits: "",
                    tax: "",
                    totalSalePriceTL: "",
                    productCost: "",
                    shippingCost: "",
                    discountRate: "",
                })
            }
        }
    }, [open, initialData, products])

    const handleInputChange = (field: keyof SaleFormValues, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (initialData?.id) {
                await updateSale(initialData.id, formData as any)
            } else {
                await createSale(formData as any)
            }
            onOpenChange(false)
            window.location.reload()
        } catch (error) {
            alert("İşlem başarısız oldu")
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        if (confirm("Değişiklikleri kaydetmeden çıkmak istediğinize emin misiniz?")) {
            onOpenChange(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={(val) => {
            if (!val) handleCancel()
        }}>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-white border-l border-slate-200 text-slate-900 p-0">
                <div className="flex flex-col h-full bg-white">
                    <SheetHeader className="px-6 py-6 border-b border-slate-100 bg-white sticky top-0 z-10">
                        <SheetTitle className="text-2xl font-bold text-slate-900 tracking-tight">
                            {initialData ? "Satışı Düzenle" : "Yeni Satış Oluştur"}
                        </SheetTitle>
                        <SheetDescription className="text-slate-500">
                            Satış bilgilerini aşağıdan yönetebilirsiniz.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-6">
                        <form id="sale-form" onSubmit={handleSubmit} className="space-y-6">

                            {/* Row 1: Store & Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-600 font-medium">Mağaza</Label>
                                    <Select
                                        value={formData.store}
                                        onValueChange={(v) => handleInputChange("store", v)}
                                    >
                                        <SelectTrigger className="w-full bg-slate-50 border-slate-200 h-10">
                                            <SelectValue placeholder="Mağaza seçin" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-slate-200">
                                            <SelectItem value="RADIANT_JEWELRY_GIFT">Radiant Jewelry Gift</SelectItem>
                                            <SelectItem value="THE_TRENDY_OUTFITTERS">The Trendy Outfitters</SelectItem>
                                            <SelectItem value="LAMIAFERIS">Lamiaferis (Etsy)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-600 font-medium">Tarih</Label>
                                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal bg-slate-50 border-slate-200 text-slate-900 h-10",
                                                    !formData.date && "text-muted-foreground"
                                                )}
                                            >
                                                {formData.date ? format(formData.date, "d MMMM yyyy", { locale: tr }) : <span>Tarih seçin</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-white border-slate-200" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={formData.date}
                                                onSelect={(d) => {
                                                    if (d) {
                                                        handleInputChange("date", d)
                                                        setIsCalendarOpen(false)
                                                    }
                                                }}
                                                locale={tr}
                                                className="text-slate-900"
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            {/* Row 2: Order No */}
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-medium">Sipariş Numarası</Label>
                                <Input
                                    placeholder="3949577961"
                                    value={formData.orderNo}
                                    onChange={(e) => handleInputChange("orderNo", e.target.value)}
                                    className="bg-slate-50 border-slate-200 h-10"
                                />
                            </div>

                            {/* Row 3: Product Full Width (Combobox) */}
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-medium">Ürün</Label>
                                <Popover open={isProductOpen} onOpenChange={setIsProductOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={isProductOpen}
                                            className="w-full justify-between bg-slate-50 border-slate-200 h-10 font-normal hover:bg-slate-50 hover:text-slate-900"
                                        >
                                            {formData.productId
                                                ? products.find((product) => product.id === formData.productId)?.name
                                                : "Ürün seçin..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border-slate-200 z-[100]" align="start">
                                        <Command>
                                            <CommandInput placeholder="Ürün ara..." />
                                            <CommandList>
                                                <CommandEmpty>Ürün bulunamadı.</CommandEmpty>
                                                <CommandGroup>
                                                    {products.map((product) => (
                                                        <CommandItem
                                                            key={product.id}
                                                            value={product.name}
                                                            onSelect={(currentValue) => {
                                                                handleInputChange("productId", product.id === formData.productId ? "" : product.id)
                                                                setIsProductOpen(false)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    formData.productId === product.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {product.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Row 4: Quantity & Discount Rate */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-600 font-medium">Adet</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={formData.quantity}
                                        onChange={(e) => handleInputChange("quantity", parseInt(e.target.value))}
                                        className="bg-slate-50 border-slate-200 h-10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-600 font-medium">İndirim Oranı (%)</Label>
                                    <Select
                                        value={formData.discountRate ? formData.discountRate.toString() : ""}
                                        onValueChange={(v) => handleInputChange("discountRate", parseInt(v))}
                                    >
                                        <SelectTrigger className="w-full bg-slate-50 border-slate-200 h-10">
                                            <SelectValue placeholder="Seçiniz" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-slate-200 max-h-[200px]">
                                            {[25, 30, 35, 40, 45, 50, 55, 60, 65, 70].map((rate) => (
                                                <SelectItem key={rate} value={rate.toString()}>{rate}%</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Financials Block */}
                            <div className="pt-2 space-y-4">

                                {/* Row 1: Buyer Paid & Fees/Credits */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-600 font-medium">Müşteri Ödemesi ($)</Label>
                                        <Input
                                            type="number" step="0.01" placeholder="0.00"
                                            value={formData.buyerPaid || ""}
                                            onChange={(e) => handleInputChange("buyerPaid", e.target.value === "" ? "" : parseFloat(e.target.value))}
                                            className="bg-white border-orange-200 focus:border-orange-500 h-10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-600 font-medium">Kesintiler ($)</Label>
                                        <Input
                                            type="number" step="0.01" placeholder="0.00"
                                            value={formData.feesCredits || ""}
                                            onChange={(e) => handleInputChange("feesCredits", e.target.value === "" ? "" : parseFloat(e.target.value))}
                                            className="bg-white border-slate-200 h-10"
                                        />
                                    </div>
                                </div>

                                {/* Row 2: Tax & Total Sale Price */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-600 font-medium">Vergi ($)</Label>
                                        <Input
                                            type="number" step="0.01" placeholder="0.00"
                                            value={formData.tax || ""}
                                            onChange={(e) => handleInputChange("tax", e.target.value === "" ? "" : parseFloat(e.target.value))}
                                            className="bg-white border-slate-200 h-10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-600 font-medium">Toplam Satış (TL)</Label>
                                        <Input
                                            type="number" step="0.01" placeholder="0.00"
                                            value={formData.totalSalePriceTL || ""}
                                            onChange={(e) => handleInputChange("totalSalePriceTL", e.target.value === "" ? "" : parseFloat(e.target.value))}
                                            className="bg-white border-orange-200 focus:border-orange-500 h-10"
                                        />
                                    </div>
                                </div>

                                {/* Row 3: Product Cost & Shipping Cost */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-600 font-medium">Ürün Maliyeti ($)</Label>
                                        <Input
                                            type="number" step="0.01" placeholder="0.00"
                                            value={formData.productCost || ""}
                                            onChange={(e) => handleInputChange("productCost", e.target.value === "" ? "" : parseFloat(e.target.value))}
                                            className="bg-white border-slate-200 h-10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-600 font-medium">Kargo Maliyeti ($)</Label>
                                        <Input
                                            type="number" step="0.01" placeholder="0.00"
                                            value={formData.shippingCost || ""}
                                            onChange={(e) => handleInputChange("shippingCost", e.target.value === "" ? "" : parseFloat(e.target.value))}
                                            className="bg-white border-slate-200 h-10"
                                        />
                                    </div>
                                </div>
                            </div>

                        </form>
                    </div>

                    <SheetFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                        <Button
                            onClick={(e) => handleSubmit(e as any)}
                            disabled={loading}
                            className="w-full bg-[#F16521] hover:bg-[#d5561b] text-white h-12 text-lg font-medium shadow-md shadow-orange-900/10"
                        >
                            <Save className="mr-2 h-5 w-5" />
                            {loading ? "Kaydediliyor..." : "Satışı Kaydet"}
                        </Button>
                    </SheetFooter>
                </div>
            </SheetContent>
        </Sheet>
    )
}
