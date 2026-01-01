"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet"
import { createProduct, updateProduct, deleteProduct } from "@/app/actions/settings"
import { useRouter as useNextRouter } from "next/navigation"

type Product = {
    id: string
    name: string
    costUSD: number
    imgUrl?: string | null
}

export function ProductsTab({ initialProducts }: { initialProducts: Product[] }) {
    const router = useNextRouter()
    const [products, setProducts] = useState(initialProducts)
    const [isOpen, setIsOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({ name: "", costUSD: 0 })
    const [loading, setLoading] = useState(false)

    // Using initialProducts directly for rendering to ensure updates show up after router.refresh()
    const displayProducts = initialProducts;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (editingId) {
                await updateProduct(editingId, formData)
            } else {
                await createProduct(formData)
            }
            setIsOpen(false)
            router.refresh()
        } catch (error) {
            alert("İşlem başarısız")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Emin misiniz?")) return
        await deleteProduct(id)
        router.refresh()
    }

    const openEdit = (product: Product) => {
        setEditingId(product.id)
        setFormData({ name: product.name, costUSD: product.costUSD })
        setIsOpen(true)
    }

    const openCreate = () => {
        setEditingId(null)
        setFormData({ name: "", costUSD: 0 })
        setIsOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Ürün Listesi</h3>
                <Button onClick={openCreate} className="bg-orange-600 hover:bg-orange-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> Ürün Ekle
                </Button>
            </div>

            <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-100 border-b border-slate-200 hover:bg-slate-100">
                            <TableHead className="text-left font-bold text-slate-700 border-r border-slate-200 px-4 py-3">Ürün Adı</TableHead>
                            <TableHead className="text-left font-bold text-slate-700 border-r border-slate-200 px-4 py-3">Maliyet (USD)</TableHead>
                            <TableHead className="text-left font-bold text-slate-700 px-4 py-3 w-[120px]">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {displayProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24 text-slate-500">
                                    Ürün bulunamadı.
                                </TableCell>
                            </TableRow>
                        ) : (
                            displayProducts.map((product) => (
                                <TableRow key={product.id} className="border-b border-slate-200 hover:bg-slate-50">
                                    <TableCell className="font-medium text-slate-900 border-r border-slate-200 px-4 py-3">{product.name}</TableCell>
                                    <TableCell className="text-slate-700 border-r border-slate-200 px-4 py-3">${product.costUSD.toFixed(2)}</TableCell>
                                    <TableCell className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEdit(product)}
                                                className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(product.id)}
                                                className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent className="bg-white border-l border-slate-200 text-slate-900 sm:max-w-md p-6 overflow-y-auto">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="text-slate-900 text-xl">{editingId ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}</SheetTitle>
                        <SheetDescription className="text-slate-500">
                            {editingId ? "Ürün bilgilerini güncelleyin." : "Listenize yeni bir ürün ekleyin."}
                        </SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name">Ürün Adı</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="bg-white border-slate-200 focus-visible:ring-orange-500"
                                placeholder="Örn: Kolye Ucu"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cost">Maliyet (USD)</Label>
                            <Input
                                id="cost"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.costUSD}
                                onChange={(e) => setFormData({ ...formData, costUSD: parseFloat(e.target.value) })}
                                className="bg-white border-slate-200 focus-visible:ring-orange-500"
                                placeholder="0.00"
                                required
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
        </div>
    )
}
