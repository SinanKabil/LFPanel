"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, X, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { createProduct, updateProduct, deleteProduct } from "@/app/actions/settings"
import { useRouter } from "next/navigation"

interface Product {
    id: string
    name: string
    costUSD: number
    productId?: string
}

interface ProductManagerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    products: Product[]
}

export function ProductManagerDialog({ open, onOpenChange, products }: ProductManagerDialogProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [newProductName, setNewProductName] = useState("")
    const [newProductCost, setNewProductCost] = useState("")

    const handleCreate = async () => {
        if (!newProductName.trim()) return
        setLoading(true)
        try {
            const res = await createProduct({ name: newProductName, costUSD: parseFloat(newProductCost) || 0 })
            if (res.success) {
                setNewProductName("")
                setNewProductCost("")
                router.refresh()
            } else {
                alert(res.error)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async () => {
        if (!editingProduct || !editingProduct.name.trim()) return
        setLoading(true)
        try {
            const res = await updateProduct(editingProduct.id, { name: editingProduct.name, costUSD: editingProduct.costUSD })
            if (res.success) {
                setEditingProduct(null)
                router.refresh()
            } else {
                alert(res.error)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return
        setLoading(true)
        try {
            const res = await deleteProduct(id)
            if (res.success) {
                router.refresh()
            } else {
                alert(res.error)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl bg-white text-slate-900 border-slate-200">
                <DialogHeader>
                    <DialogTitle>Ürün Yönetimi</DialogTitle>
                    <DialogDescription>
                        Yeni ürün ekleyebilir, mevcut ürünleri düzenleyebilir veya silebilirsiniz.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Create New Product Form */}
                    <div className="flex items-end gap-2 p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ürün Adı</label>
                            <Input
                                placeholder="Örn: Gold Necklace"
                                value={newProductName}
                                onChange={(e) => setNewProductName(e.target.value)}
                                className="bg-white border-slate-200"
                            />
                        </div>
                        <div className="w-32 space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Maliyet ($)</label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={newProductCost}
                                onChange={(e) => setNewProductCost(e.target.value)}
                                className="bg-white border-slate-200"
                            />
                        </div>
                        <Button
                            onClick={handleCreate}
                            disabled={loading || !newProductName.trim()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Product List */}
                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                        {products.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">Henüz ürün eklenmemiş.</p>
                        ) : (
                            products.map((product) => (
                                <div key={product.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors group">
                                    {editingProduct?.id === product.id ? (
                                        <div className="flex items-center gap-2 flex-1 animate-in fade-in zoom-in-95 duration-200">
                                            <Input
                                                value={editingProduct.name}
                                                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                                className="flex-1 h-8 bg-white"
                                                autoFocus
                                            />
                                            <Input
                                                type="number"
                                                value={editingProduct.costUSD}
                                                onChange={(e) => setEditingProduct({ ...editingProduct, costUSD: parseFloat(e.target.value) || 0 })}
                                                className="w-24 h-8 bg-white"
                                            />
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-50" onClick={handleUpdate}>
                                                <Save className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:bg-slate-100" onClick={() => setEditingProduct(null)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="font-medium text-slate-900 truncate" title={product.name}>{product.name}</div>
                                                <div className="text-xs text-slate-500">Maliyet: ${product.costUSD.toFixed(2)}</div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => setEditingProduct(product)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(product.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
