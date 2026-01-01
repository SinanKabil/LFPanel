"use client"

import { useState, useEffect } from "react"
import { Calculator, DollarSign, Percent } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function CalculatorPage() {
    // Inputs (Defaults)
    const [productCost, setProductCost] = useState<number | "">("")
    const [shippingCost, setShippingCost] = useState<number | "">("")
    const [targetProfit, setTargetProfit] = useState<number | "">(0)
    const [feeRate, setFeeRate] = useState<number | "">(18)

    // Calculated Values
    const [requiredSalePrice, setRequiredSalePrice] = useState<number>(0)

    useEffect(() => {
        const pCost = Number(productCost) || 0
        const sCost = Number(shippingCost) || 0
        const tProfit = Number(targetProfit) || 0
        const fRate = Number(feeRate) || 0

        if (fRate >= 100) {
            setRequiredSalePrice(0)
            return
        }

        const totalCost = pCost + sCost
        // Formula: SalePrice - (SalePrice * Fee%) - TotalCost = TargetProfit
        // SalePrice * (1 - Fee%) = TargetProfit + TotalCost
        // SalePrice = (TargetProfit + TotalCost) / (1 - Fee%)

        const divisor = 1 - (fRate / 100)
        const price = (tProfit + totalCost) / divisor
        setRequiredSalePrice(price)
    }, [productCost, shippingCost, targetProfit, feeRate])

    const discountRates = [70, 60, 50, 45, 40, 35, 30, 25]
    const recommendedListPrice = requiredSalePrice * 2

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <Calculator className="h-8 w-8 text-slate-900" />
                    Fiyat Hesaplama
                </h2>
                <p className="text-slate-500 text-sm">Ürün maliyetlerine göre ideal fiyat analizi simülasyonu.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Inputs & Summary Card */}
                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="bg-white border-b border-slate-100 pb-4">
                        <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-slate-500" />
                            Maliyet & Hedefler
                        </CardTitle>
                        <CardDescription>Giderlerinizi ve hedeflediğiniz kar miktarını giriniz.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ürün Maliyeti</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-400 font-medium">$</span>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        className="pl-7 bg-white border-slate-200 focus:border-slate-400 transition-colors font-medium text-slate-900 shadow-sm"
                                        value={productCost}
                                        onChange={(e) => setProductCost(e.target.value === "" ? "" : parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kargo Maliyeti</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-400 font-medium">$</span>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        className="pl-7 bg-white border-slate-200 focus:border-slate-400 transition-colors font-medium text-slate-900 shadow-sm"
                                        value={shippingCost}
                                        onChange={(e) => setShippingCost(e.target.value === "" ? "" : parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hedef Kar</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-400 font-medium">$</span>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        className="pl-7 bg-white border-slate-200 focus:border-slate-400 transition-colors font-medium text-slate-900 shadow-sm"
                                        value={targetProfit}
                                        onChange={(e) => setTargetProfit(e.target.value === "" ? "" : parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kesinti (%)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-400 font-medium">%</span>
                                    <Input
                                        type="number"
                                        placeholder="18"
                                        className="pl-8 bg-white border-slate-200 focus:border-slate-400 transition-colors font-medium text-slate-900 shadow-sm"
                                        value={feeRate}
                                        onChange={(e) => setFeeRate(e.target.value === "" ? "" : parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-dashed border-slate-200 pt-6 space-y-4">
                            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4 border border-slate-200">
                                <div>
                                    <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Satılması Gereken</p>
                                    <p className="text-sm text-slate-400">Hedef karı bırakan minimum tutar</p>
                                </div>
                                <p className="text-2xl font-bold text-slate-700 tracking-tight">
                                    ${requiredSalePrice.toFixed(2)}
                                </p>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-slate-900 p-4 border border-slate-800 shadow-sm">
                                <div>
                                    <p className="text-xs text-white font-bold uppercase mb-1">Önerilen Liste Fiyatı</p>
                                    <p className="text-sm text-slate-400">İndirimler için baz fiyat</p>
                                </div>
                                <p className="text-3xl font-black text-white tracking-tight">
                                    ${recommendedListPrice.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Results Table Card */}
                <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-white border-b border-slate-100 pb-4">
                        <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Percent className="h-5 w-5 text-slate-500" />
                            İndirim & Kar Simülasyonu
                        </CardTitle>
                        <CardDescription>Liste fiyatı <strong>${recommendedListPrice.toFixed(2)}</strong> üzerinden senaryolar.</CardDescription>
                    </CardHeader>
                    <div className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="w-1/3 text-left font-bold text-slate-600 px-6 py-3">İndirim Oranı</TableHead>
                                    <TableHead className="w-1/3 text-left font-bold text-slate-600 px-6 py-3">Satış Fiyatı</TableHead>
                                    <TableHead className="w-1/3 text-right font-bold text-slate-900 px-6 py-3">Net Kar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {discountRates.map((rate) => {
                                    const salePrice = recommendedListPrice * (1 - rate / 100)
                                    const feeAmount = salePrice * ((Number(feeRate) || 0) / 100)
                                    const totalCost = (Number(productCost) || 0) + (Number(shippingCost) || 0)
                                    const profit = salePrice - feeAmount - totalCost

                                    // Color Logic: >0 Green, <0 Red, 0 Orange
                                    let colorClass = "text-orange-500" // Default for 0
                                    if (profit > 0.009) colorClass = "text-green-600"
                                    else if (profit < -0.009) colorClass = "text-red-600"

                                    return (
                                        <TableRow key={rate} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <TableCell className="font-medium text-slate-600 px-6 py-3">
                                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">%{rate}</span>
                                            </TableCell>
                                            <TableCell className="font-bold text-slate-700 px-6 py-3">
                                                ${salePrice.toFixed(2)}
                                            </TableCell>
                                            <TableCell className={`text-right font-black px-6 py-3 text-base ${colorClass}`}>
                                                ${profit.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </div>
    )
}
