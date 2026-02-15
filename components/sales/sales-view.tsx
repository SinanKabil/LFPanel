"use client"

import { useState } from "react"
import { Plus, ShoppingBag, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SalesTable } from "./sales-table"
import { SalesSheet, SaleFormValues } from "./sales-sheet"
import { subDays, subMonths, subYears, isAfter, startOfYear } from "date-fns"

export default function SalesView({ sales, products }: { sales: any[], products: any[] }) {
    const [periodFilter, setPeriodFilter] = useState("month") // week, month, year, last_year, all
    const [storeFilter, setStoreFilter] = useState("all")
    const [productFilter, setProductFilter] = useState("all")
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [editingSale, setEditingSale] = useState<SaleFormValues | null>(null)
    const [showMissingOnly, setShowMissingOnly] = useState(false)

    // Calculate missing costs count (always based on ALL sales to show correct warning)
    const missingCostCount = sales.filter(s => s.productCost === 0 || s.shippingCost === 0).length

    // Client-side filtering
    const filteredSales = sales.filter(sale => {
        // If showing missing only, ignore other filters
        if (showMissingOnly) {
            return (sale.productCost === 0 || sale.shippingCost === 0)
        }

        const date = new Date(sale.date)
        const now = new Date()

        // Period Filter
        let periodMatch = true
        if (periodFilter === "week") periodMatch = isAfter(date, subDays(now, 7))
        else if (periodFilter === "month") periodMatch = isAfter(date, subMonths(now, 1))
        else if (periodFilter === "year") periodMatch = isAfter(date, startOfYear(now))
        else if (periodFilter === "last_year") {
            const startLast = startOfYear(subYears(now, 1))
            const endLast = startOfYear(now)
            periodMatch = isAfter(date, startLast) && !isAfter(date, endLast)
        }

        // Store Filter
        let storeMatch = true
        if (storeFilter !== "all") {
            storeMatch = sale.store === storeFilter
        }

        // Product Filter
        let productMatch = true
        if (productFilter !== "all") {
            productMatch = sale.productId === productFilter
        }

        return periodMatch && storeMatch && productMatch
    })

    const handleCreate = () => {
        setEditingSale(null)
        setIsSheetOpen(true)
    }

    const handleEdit = (sale: any) => {
        setEditingSale({
            id: sale.id,
            store: sale.store,
            type: sale.type,
            productId: sale.productId,
            quantity: sale.quantity,
            date: sale.date,
            orderNo: sale.orderNo,
            buyerPaid: sale.buyerPaid,
            feesCredits: sale.feesCredits,
            tax: sale.tax,
            totalSalePriceTL: sale.totalSalePriceTL,
            productCost: sale.productCost,
            shippingCost: sale.shippingCost,
            discountRate: sale.discountRate,
        })
        setIsSheetOpen(true)
    }

    return (
        <div className="space-y-6">
            {missingCostCount > 0 && (
                <Alert variant="destructive" className="flex items-center justify-between py-2 px-4 bg-red-50 border-red-200 text-red-900 icon-red-600">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                            Maliyet bilgisi eksik <strong>{missingCostCount}</strong> satış var.
                        </span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs bg-white border-red-200 text-red-700 hover:bg-red-100 hover:text-red-900"
                        onClick={() => setShowMissingOnly(!showMissingOnly)}
                    >
                        {showMissingOnly ? "Tümünü Göster" : "Listele"}
                    </Button>
                </Alert>
            )}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-1 flex items-center gap-2">
                        <ShoppingBag className="h-8 w-8 text-orange-600" />
                        Satışlar
                    </h2>
                    <p className="text-slate-500 text-sm">Satışlarınızı takip edin ve yönetin.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">

                    {/* Store Filter */}
                    <Select value={storeFilter} onValueChange={setStoreFilter}>
                        <SelectTrigger className="w-full sm:w-[150px] bg-white border-slate-200 text-slate-900">
                            <SelectValue placeholder="Mağaza" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-slate-900">
                            <SelectItem value="all">Tüm Mağazalar</SelectItem>
                            <SelectItem value="RADIANT_JEWELRY_GIFT">Radiant Jewelry Gift</SelectItem>
                            <SelectItem value="THE_TRENDY_OUTFITTERS">The Trendy Outfitters</SelectItem>
                            <SelectItem value="LAMIAFERIS">Lamiaferis (Etsy)</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Product Filter */}
                    <Select value={productFilter} onValueChange={setProductFilter}>
                        <SelectTrigger className="w-full sm:w-[180px] bg-white border-slate-200 text-slate-900">
                            <SelectValue placeholder="Ürün" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-slate-900">
                            <SelectItem value="all">Tüm Ürünler</SelectItem>
                            {products
                                .filter(p => sales.some(s => s.productId === p.id))
                                .map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                        </SelectContent>
                    </Select>

                    {/* Period Filter */}
                    <Select value={periodFilter} onValueChange={setPeriodFilter}>
                        <SelectTrigger className="w-full sm:w-[150px] bg-white border-slate-200 text-slate-900">
                            <SelectValue placeholder="Tarih" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-slate-900">
                            <SelectItem value="week">Son 1 Hafta</SelectItem>
                            <SelectItem value="month">Son 1 Ay</SelectItem>
                            <SelectItem value="year">Bu Yıl</SelectItem>
                            <SelectItem value="last_year">Geçen Yıl</SelectItem>
                            <SelectItem value="all">Tüm Zamanlar</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button onClick={handleCreate} className="bg-orange-600 hover:bg-orange-700 text-white whitespace-nowrap">
                        <Plus className="mr-2 h-4 w-4" /> Satış Oluştur
                    </Button>
                </div>
            </div>

            <SalesTable sales={filteredSales} onEdit={handleEdit} />

            <SalesSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                initialData={editingSale}
                products={products}
            />
        </div>
    )
}
