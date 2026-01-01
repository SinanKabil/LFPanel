"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { CalendarIcon, Plus, Settings, Check, X, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { createExpense, updateExpense, createExpenseCategory, updateExpenseCategory, deleteExpenseCategory } from "@/app/actions/expenses"
import { useRouter } from "next/navigation"
// import { Store } from "@prisma/client"

const formSchema = z.object({
    date: z.date(),
    category: z.string().min(1, "Kategori seçiniz"),
    amount: z.string().min(1, "Tutar giriniz"),
    description: z.string().optional(),
})

type ExpenseSheetProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData?: any | null
    categories: any[]
    store: any
}

export function ExpenseSheet({ open, onOpenChange, initialData, categories: initialCategories, store }: ExpenseSheetProps) {
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState(initialCategories)

    // Category Manager State
    const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
    const [editCategoryName, setEditCategoryName] = useState("")

    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            date: new Date(),
            category: "",
            amount: "",
            description: "",
        },
    })

    useEffect(() => {
        setCategories(initialCategories)
    }, [initialCategories])

    useEffect(() => {
        if (open) {
            form.reset({
                date: initialData?.date ? new Date(initialData.date) : new Date(),
                category: initialData?.category || "",
                amount: initialData?.amountTL?.toString() || "",
                description: initialData?.description || "",
            })
        }
    }, [open, initialData, form])

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return

        const res = await createExpenseCategory(newCategoryName)
        if (res.success && res.data) {
            setCategories(prev => [...prev, res.data!].sort((a, b) => a.name.localeCompare(b.name)))
            form.setValue("category", res.data!.name) // Auto select
            setNewCategoryName("")
            // Keep popover open
            router.refresh()
        } else {
            alert(res.error || "Hata oluştu")
        }
    }

    const handleUpdateCategory = async (id: string) => {
        if (!editCategoryName.trim()) return
        const res = await updateExpenseCategory(id, editCategoryName)
        if (res.success) {
            setCategories(prev => prev.map(c => c.id === id ? { ...c, name: editCategoryName } : c))
            setEditingCategoryId(null)
            router.refresh()
        } else {
            alert(res.error || "Güncelleme başarısız")
        }
    }

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("Kategoriyi silmek istediğinize emin misiniz?")) return
        const res = await deleteExpenseCategory(id)
        if (res.success) {
            setCategories(prev => prev.filter(c => c.id !== id))
            const currentCat = form.getValues("category")
            if (categories.find(c => c.id === id)?.name === currentCat) {
                form.setValue("category", "")
            }
            router.refresh()
        } else {
            alert(res.error || "Silme başarısız")
        }
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true)
        try {
            const payload = {
                date: values.date,
                category: values.category,
                store: store,
                amountTL: parseFloat(values.amount),
                description: values.description,
            }

            let res
            if (initialData?.id) {
                res = await updateExpense(initialData.id, payload)
            } else {
                res = await createExpense(payload)
            }

            if (res.success) {
                onOpenChange(false)
                router.refresh()
            } else {
                alert(res.error || "Hata oluştu")
            }
        } catch (error) {
            console.error(error)
            alert("Beklenmeyen bir hata oluştu")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-[500px] p-6 text-slate-900 bg-white border-l border-slate-200">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-xl font-bold text-slate-900">{initialData ? "Gider Düzenle" : "Yeni Gider Ekle"}</SheetTitle>
                    <SheetDescription className="text-slate-500">
                        Gider detaylarını giriniz.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col space-y-2">
                                    <FormLabel className="font-semibold text-slate-700">Tarih</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal bg-white border-slate-200 text-slate-900 hover:bg-slate-50 focus-visible:ring-orange-500",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "d MMMM yyyy", { locale: tr })
                                                    ) : (
                                                        <span>Tarih seçiniz</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-white border-slate-200 shadow-md" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date > new Date() || date < new Date("1900-01-01")
                                                }
                                                initialFocus
                                                className="bg-white text-slate-900"
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="font-semibold text-slate-700">Gider Türü (Kategori)</FormLabel>
                                    <div className="flex gap-2">
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full bg-white border-slate-200 text-slate-900 focus:ring-orange-500">
                                                    <SelectValue placeholder="Kategori seçiniz" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white border-slate-200 text-slate-900">
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.name}>
                                                        {cat.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Popover open={isCategoryManagerOpen} onOpenChange={setIsCategoryManagerOpen}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" type="button" className="shrink-0 bg-white border-slate-200 hover:bg-slate-50" title="Kategorileri Yönet">
                                                    <Settings className="h-4 w-4 text-slate-600" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80 bg-white border-slate-200 p-4 shadow-xl" align="end">
                                                <div className="space-y-4">
                                                    <h4 className="font-semibold text-slate-900 border-b pb-2">Kategori Yönetimi</h4>

                                                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                                        {categories.map(cat => (
                                                            <div key={cat.id} className="flex items-center justify-between text-sm group">
                                                                {editingCategoryId === cat.id ? (
                                                                    <div className="flex items-center gap-2 flex-1">
                                                                        <Input
                                                                            value={editCategoryName}
                                                                            onChange={(e) => setEditCategoryName(e.target.value)}
                                                                            className="h-7 text-xs"
                                                                        />
                                                                        <Button size="icon" variant="ghost" onClick={() => handleUpdateCategory(cat.id)} className="h-6 w-6 text-green-600"><Check className="h-3 w-3" /></Button>
                                                                        <Button size="icon" variant="ghost" onClick={() => setEditingCategoryId(null)} className="h-6 w-6 text-slate-400"><X className="h-3 w-3" /></Button>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <span className="text-slate-700">{cat.name}</span>
                                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <Button
                                                                                size="icon"
                                                                                variant="ghost"
                                                                                onClick={() => { setEditingCategoryId(cat.id); setEditCategoryName(cat.name) }}
                                                                                className="h-6 w-6 text-slate-400 hover:text-blue-600"
                                                                            >
                                                                                <Pencil className="h-3 w-3" />
                                                                            </Button>
                                                                            <Button
                                                                                size="icon"
                                                                                variant="ghost"
                                                                                onClick={() => handleDeleteCategory(cat.id)}
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
                                                            value={newCategoryName}
                                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                                            className="h-8 text-sm bg-slate-50 border-slate-200"
                                                            placeholder="Yeni Kategori Adı"
                                                        />
                                                        <Button size="sm" onClick={handleAddCategory} className="h-8 bg-orange-600 hover:bg-orange-700 text-white px-3">
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="font-semibold text-slate-700">Tutar (TL)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            {...field}
                                            className="bg-white border-slate-200 text-slate-900 focus-visible:ring-orange-500 font-medium text-lg"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="font-semibold text-slate-700">Açıklama (Opsiyonel)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Not..." {...field} className="bg-white border-slate-200 text-slate-900" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-6 text-lg shadow-orange-200 shadow-lg transition-all hover:scale-[1.02]" disabled={loading}>
                            {loading ? "Kaydediliyor..." : (initialData ? "Güncelle" : "Kaydet")}
                        </Button>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}
