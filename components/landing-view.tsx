"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginAction } from "@/app/actions/auth"

export default function LandingView() {
    const [selectedBrand, setSelectedBrand] = useState<"ETSY" | "LAMIAFERIS" | null>(null)
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const res = await loginAction(password, selectedBrand || undefined)
            if (res.success) {
                // Redirect based on brand
                if (selectedBrand === "ETSY") {
                    router.push("/dashboard/etsy")
                } else {
                    router.push("/dashboard/lamiaferis")
                }
            } else {
                setError(res.error || "Login failed")
            }
        } catch (err) {
            setError("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-900">
            <div className="mb-16 text-center space-y-3">
                <h1 className="text-3xl font-light tracking-tight text-slate-700">
                    Hoş Geldiniz
                </h1>
                <p className="text-slate-500 font-light">
                    Başlamak için lütfen markanızı seçin
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-8 items-center justify-center">
                <Button
                    onClick={() => setSelectedBrand("ETSY")}
                    className="w-64 h-32 text-2xl font-bold rounded-2xl bg-[#F16521] hover:bg-[#d6561b] text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl hover:-translate-y-1"
                >
                    ETSY
                </Button>

                <Button
                    onClick={() => setSelectedBrand("LAMIAFERIS")}
                    className="w-64 h-32 text-2xl font-bold rounded-2xl bg-[#000080] hover:bg-[#000060] text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl hover:-translate-y-1"
                >
                    LAMIAFERIS
                </Button>
            </div>

            {selectedBrand && (
                <Dialog open={!!selectedBrand} onOpenChange={(open) => !open && setSelectedBrand(null)}>
                    <DialogContent className="sm:max-w-md bg-white border-slate-100 shadow-2xl rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-slate-800">{selectedBrand} Giriş</DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Devam etmek için admin şifresini giriniz.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleLogin} className="space-y-5 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-600">Şifre</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-400 h-10 transition-all font-medium"
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
                            <div className="flex justify-end gap-3 mt-6">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setSelectedBrand(null)}
                                    className="text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                                >
                                    İptal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className={selectedBrand === "ETSY" ? "bg-[#F16521] hover:bg-[#d6561b] text-white" : "bg-[#000080] hover:bg-[#000060] text-white"}
                                >
                                    {loading ? "Kontrol ediliyor..." : "Giriş Yap"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
