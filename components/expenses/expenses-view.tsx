"use client"

import { useState } from "react"
import { HandCoins, Plus, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ExpensesTable } from "./expenses-table"

import { ExpensesSheet } from "./expenses-sheet"
// import { Store } from "@prisma/client" - Removed to prevent bundling issues

type ExpensesViewProps = {
    expenses: any[]
    categories: any[]
    store: any // Store enum treated as any/string on client to avoid Prisma import
}

export default function ExpensesView({ expenses, categories, store }: ExpensesViewProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    console.log("ExpensesView mounting. Expenses:", expenses?.length, "Categories:", categories?.length, "Store:", store)

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                        <HandCoins className="h-6 w-6 text-slate-900" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Giderler</h2>
                </div>

                <div className="flex items-center gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-all" title="Tümünü Gör">
                                <Maximize2 className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[100vw] w-[100vw] h-[100vh] flex flex-col p-6 overflow-hidden rounded-none m-0 border-none sm:max-w-[100vw]">
                            <DialogHeader>
                                <DialogTitle>Tüm Giderler</DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto mt-4 px-1">
                                <ExpensesTable expenses={expenses} categories={categories} store={store} showAll={true} />
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-[#000080] hover:bg-[#000060] text-white shadow-md hover:shadow-xl hover:scale-105 transition-all rounded-full h-8 px-4 text-xs font-semibold"
                    >
                        <Plus className="mr-2 h-3.5 w-3.5" />
                        Yeni Gider Ekle
                    </Button>
                </div>
            </div>

            <ExpensesTable expenses={expenses} categories={categories} store={store} />

            <ExpensesSheet
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                store={store}
                initialData={null}
            />
        </div>
    )
}
