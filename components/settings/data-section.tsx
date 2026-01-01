"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Upload, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { exportData, getSampleExcel, importData } from "@/app/actions/data-management"

type Props = {
    title: string
    description: string
    type: "pos" | "cash" | "expense" | "etsy_sales" | "etsy_expense"
    brand: string
}

export function DataSection({ title, description, type, brand }: Props) {
    const [loadingExport, setLoadingExport] = useState(false)
    const [loadingSample, setLoadingSample] = useState(false)
    const [loadingImport, setLoadingImport] = useState(false)
    const [status, setStatus] = useState<{ type: "success" | "error", msg: string } | null>(null)

    const handleDownload = (base64: string, filename: string) => {
        const link = document.createElement("a")
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const onExport = async () => {
        setLoadingExport(true)
        setStatus(null)
        const res = await exportData(type, brand)
        if (res.success && res.data) {
            handleDownload(res.data, res.filename || "export.xlsx")
            setStatus({ type: "success", msg: "Dışa aktarma başarılı." })
        } else {
            setStatus({ type: "error", msg: res.error || "Hata oluştu." })
        }
        setLoadingExport(false)
    }

    const onSample = async () => {
        setLoadingSample(true)
        const res = await getSampleExcel(type)
        if (res.success && res.data) {
            handleDownload(res.data, res.filename || "sample.xlsx")
        }
        setLoadingSample(false)
    }

    const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setLoadingImport(true)
        setStatus(null)

        const formData = new FormData()
        formData.append("file", file)

        const res = await importData(formData, type)
        if (res.success) {
            setStatus({ type: "success", msg: `${res.count} kayıt başarıyla eklendi.` })
        } else {
            setStatus({ type: "error", msg: res.error || "İçe aktarma hatası." })
        }
        setLoadingImport(false)
        // Reset input
        e.target.value = ""
    }

    return (
        <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    {title}
                </CardTitle>
                <CardDescription className="text-xs">{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col gap-3">
                    <Button variant="outline" size="sm" onClick={onExport} disabled={loadingExport} className="w-full justify-start gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-green-700">
                        {loadingExport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Mevcut Verileri İndir (Excel)
                    </Button>

                    <div className="relative">
                        <Input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={onImport}
                            disabled={loadingImport}
                            className="hidden"
                            id={`file-${type}`}
                        />
                        <Label htmlFor={`file-${type}`} className={`flex items-center gap-2 w-full px-3 py-2 rounded-md border border-dashed border-slate-300 bg-slate-50 text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors text-sm font-medium ${loadingImport ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {loadingImport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            {loadingImport ? "Yükleniyor..." : "Excel'den Yükle"}
                        </Label>
                    </div>

                    <button onClick={onSample} disabled={loadingSample} className="text-[10px] text-slate-400 hover:text-orange-600 underline text-left w-fit transition-colors">
                        {loadingSample ? "Hazırlanıyor..." : "Örnek şablon indir"}
                    </button>

                    {status && (
                        <div className={`text-xs p-2 rounded-md flex items-center gap-2 ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {status.type === 'success' ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                            {status.msg}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
