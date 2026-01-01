"use client"

import { useState } from "react"
import { MessageSquare, Copy, Pencil, Trash2, Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { createMessage, updateMessage, deleteMessage } from "@/app/actions/messages"

export default function MessagesView({ messages }: { messages: any[] }) {
    const [isOpen, setIsOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [text, setText] = useState("")
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const handleOpen = (msg?: any) => {
        if (msg) {
            setEditingId(msg.id)
            setText(msg.text)
        } else {
            setEditingId(null)
            setText("")
        }
        setIsOpen(true)
    }

    const handleSubmit = async () => {
        if (editingId) {
            await updateMessage(editingId, text)
        } else {
            await createMessage(text)
        }
        setIsOpen(false)
        window.location.reload()
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Bu mesajı silmek istediğinize emin misiniz?")) return
        await deleteMessage(id)
        window.location.reload()
    }

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 1000)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-1 flex items-center gap-2">
                        <MessageSquare className="h-8 w-8 text-orange-600" />
                        Mesajlar
                    </h2>
                    <p className="text-slate-500 text-sm">Hazır mesaj şablonlarınızı yönetin.</p>
                </div>
                <Button onClick={() => handleOpen()} className="bg-orange-600 hover:bg-orange-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> Mesaj Oluştur
                </Button>
            </div>

            <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-100 border-b border-slate-200 hover:bg-slate-100">
                            <TableHead className="text-left font-bold text-slate-700 border-r border-slate-200 px-4 py-3">Mesaj</TableHead>
                            <TableHead className="text-left font-bold text-slate-700 whitespace-nowrap px-4 py-3 w-[140px]">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {messages.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center py-8 text-slate-500 border-r border-slate-200 last:border-r-0">
                                    Kayıtlı mesaj bulunamadı.
                                </TableCell>
                            </TableRow>
                        ) : (
                            messages.map((msg) => (
                                <TableRow key={msg.id} className="border-b border-slate-200 hover:bg-slate-50">
                                    <TableCell className="text-sm text-slate-900 font-normal border-r border-slate-200 px-4 py-3 align-top whitespace-pre-wrap">
                                        {msg.text}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 align-top">
                                        <div className="flex items-center gap-2">
                                            {copiedId === msg.id ? (
                                                <div className="flex items-center text-green-600 text-xs font-medium animate-in fade-in zoom-in duration-200">
                                                    <Check className="h-4 w-4 mr-1" />
                                                    Kopyalandı
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleCopy(msg.id, msg.text)}
                                                    className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                                    title="Kopyala"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpen(msg)}
                                                className="h-8 w-8 text-slate-500 hover:text-orange-600 hover:bg-orange-50"
                                                title="Düzenle"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(msg.id)}
                                                className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                                title="Sil"
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

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="bg-white border-slate-200 text-slate-900 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Mesajı Düzenle" : "Yeni Mesaj Oluştur"}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <textarea
                            rows={6}
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-2 focus:ring-offset-white"
                            placeholder="Mesaj içeriğini buraya yazın..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-700 hover:bg-slate-100">İptal</Button>
                        <Button onClick={handleSubmit} className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm shadow-orange-900/10">Kaydet</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
