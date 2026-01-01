"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createExpenseCategory } from "@/app/actions/expenses"
import { useRouter } from "next/navigation"

export function CategoryManager() {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setLoading(true)
        const res = await createExpenseCategory(name)
        if (res.success) {
            setOpen(false)
            setName("")
            router.refresh()
        } else {
            alert(res.error || "Hata oluştu")
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Yeni Kategori
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Yeni Gider Kategorisi Ekle</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="category">Kategori Adı</Label>
                        <Input
                            id="category"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Örn: Yemek, Taksi, Kargo"
                        />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700">
                        {loading ? "Ekleniyor..." : "Ekle"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
