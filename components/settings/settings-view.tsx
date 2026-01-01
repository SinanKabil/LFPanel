"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductsTab } from "./products-tab"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { updatePassword, getPasswords } from "@/app/actions/settings"
import { Eye, EyeOff, Lock, Settings } from "lucide-react"
import { DataManagementTab } from "./data-management-tab"
import { EtsyDataManagementTab } from "./etsy-data-management-tab"

export default function SettingsView({ products = [], brand = "etsy" }: { products?: any[], brand?: string }) {
    const isLamia = brand.toLowerCase() === "lamiaferis"
    const [passwords, setPasswords] = useState<{ ETSY: string; LAMIAFERIS: string }>({ ETSY: "", LAMIAFERIS: "" })

    // Passwords state management logic remains shared for data fetching simplicity
    // but UI will be strictly separated.
    const loadPasswords = async () => {
        const res = await getPasswords()
        if (res.success && res.data) {
            setPasswords(res.data)
        }
    }

    useEffect(() => {
        loadPasswords()
    }, [])

    if (isLamia) {
        return <LamiaSettingsView brand={brand} passwords={passwords} onLoadPasswords={loadPasswords} />
    } else {
        return <EtsySettingsView products={products} passwords={passwords} onLoadPasswords={loadPasswords} />
    }
}

// --- ETSY SETTINGS ---
function EtsySettingsView({ products, passwords, onLoadPasswords }: { products: any[], passwords: any, onLoadPasswords: () => void }) {
    const [showEtsy, setShowEtsy] = useState(false)
    const [loadingEtsy, setLoadingEtsy] = useState(false)

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                        <Settings className="h-6 w-6 text-slate-900" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Ayarlar</h2>
                </div>
                <p className="text-slate-500">Uygulama genel ayarlarını ve ürün kataloglarını buradan yönetebilirsiniz.</p>
            </div>

            <Tabs defaultValue="products" className="w-full">
                <TabsList className="bg-slate-100 p-1 rounded-lg inline-flex">
                    <TabsTrigger value="products" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-md transition-all px-6">
                        Ürün Listesi
                    </TabsTrigger>
                    <TabsTrigger value="data" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-md transition-all px-6">
                        Veri Yönetimi (Excel)
                    </TabsTrigger>
                    <TabsTrigger value="general" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-md transition-all px-6">
                        Genel & Şifreler
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="products" className="mt-6">
                    <ProductsTab initialProducts={products} />
                </TabsContent>

                <TabsContent value="data" className="mt-6">
                    <EtsyDataManagementTab brand="etsy" />
                </TabsContent>

                <TabsContent value="general" className="mt-6 space-y-6">
                    <div className="max-w-xl">
                        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">Etsy Giriş Şifresi</h3>
                                    <p className="text-xs text-slate-500">Panel erişimi için kullanılan şifre</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex justify-between items-center group">
                                    <div>
                                        <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Mevcut Şifre</div>
                                        <div className="font-mono text-lg font-semibold text-slate-800 tracking-wide">
                                            {passwords.ETSY ? (showEtsy ? passwords.ETSY : "•".repeat(passwords.ETSY.length)) : <span className="text-slate-400 italic">Belirlenmedi</span>}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setShowEtsy(!showEtsy)}
                                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                                    >
                                        {showEtsy ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>

                                <form action={async (formData) => {
                                    setLoadingEtsy(true)
                                    const pwd = formData.get('password') as string
                                    if (pwd) {
                                        await updatePassword('ETSY', pwd)
                                        // alert('Etsy şifresi güncellendi!')
                                        onLoadPasswords()
                                        const form = document.getElementById("form-etsy") as HTMLFormElement
                                        form?.reset()
                                    }
                                    setLoadingEtsy(false)
                                }} id="form-etsy" className="space-y-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="pwd-etsy">Yeni Şifre Belirle</Label>
                                        <Input
                                            id="pwd-etsy"
                                            name="password"
                                            type="text"
                                            placeholder="Yeni şifrenizi yazın..."
                                            className="bg-white border-slate-200 focus-visible:ring-orange-500 transition-all"
                                        />
                                    </div>
                                    <Button type="submit" disabled={loadingEtsy} className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-sm hover:shadow transition-all">
                                        {loadingEtsy ? "Güncelleniyor..." : "Şifreyi Güncelle"}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

// --- LAMIA SETTINGS ---
function LamiaSettingsView({ brand, passwords, onLoadPasswords }: { brand: string, passwords: any, onLoadPasswords: () => void }) {
    const [showLamia, setShowLamia] = useState(false)
    const [loadingLamia, setLoadingLamia] = useState(false)

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                        <Settings className="h-6 w-6 text-slate-900" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Lamiaferis Ayarlar</h2>
                </div>
                <p className="text-slate-500">Uygulama şifresini ve veri transferi işlemlerini buradan yönetebilirsiniz.</p>
            </div>

            <Tabs defaultValue="data" className="w-full">
                <TabsList className="bg-slate-100 p-1 rounded-lg inline-flex">
                    <TabsTrigger value="data" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-md transition-all px-6">
                        Veri Yönetimi (Excel)
                    </TabsTrigger>
                    <TabsTrigger value="general" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-md transition-all px-6">
                        Giriş Şifresi
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="data" className="mt-6">
                    <DataManagementTab brand={brand} />
                </TabsContent>

                <TabsContent value="general" className="mt-6 space-y-6">
                    <div className="max-w-xl">
                        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">Lamiaferis Giriş Şifresi</h3>
                                    <p className="text-xs text-slate-500">Panel erişimi için kullanılan şifre</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex justify-between items-center group">
                                    <div>
                                        <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Mevcut Şifre</div>
                                        <div className="font-mono text-lg font-semibold text-slate-800 tracking-wide">
                                            {passwords.LAMIAFERIS ? (showLamia ? passwords.LAMIAFERIS : "•".repeat(passwords.LAMIAFERIS.length)) : <span className="text-slate-400 italic">Belirlenmedi</span>}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setShowLamia(!showLamia)}
                                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                                    >
                                        {showLamia ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>

                                <form action={async (formData) => {
                                    setLoadingLamia(true)
                                    const pwd = formData.get('password') as string
                                    if (pwd) {
                                        await updatePassword('LAMIAFERIS', pwd)
                                        // alert('Lamiaferis şifresi güncellendi!')
                                        onLoadPasswords()
                                        const form = document.getElementById("form-lamia") as HTMLFormElement
                                        form?.reset()
                                    }
                                    setLoadingLamia(false)
                                }} id="form-lamia" className="space-y-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="pwd-lamia">Yeni Şifre Belirle</Label>
                                        <Input
                                            id="pwd-lamia"
                                            name="password"
                                            type="text"
                                            placeholder="Yeni şifrenizi yazın..."
                                            className="bg-white border-slate-200 focus-visible:ring-indigo-500 transition-all"
                                        />
                                    </div>
                                    <Button type="submit" disabled={loadingLamia} className="w-full bg-indigo-900 hover:bg-indigo-800 text-white shadow-sm hover:shadow transition-all">
                                        {loadingLamia ? "Güncelleniyor..." : "Şifreyi Güncelle"}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
