"use client"

import { useState, useEffect } from "react"
import { format, subDays, startOfMonth, startOfYear, subMonths, endOfMonth, endOfYear, startOfWeek, endOfWeek } from "date-fns"
import { tr } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getLamiaStores } from "@/app/actions/lamia"

export type DateRange = {
    from: Date
    to: Date
}

type Props = {
    dateRange: DateRange
    setDateRange: (range: DateRange) => void
    storeId: string
    setStoreId: (id: string) => void
}

export function AnalysisFilters({ dateRange, setDateRange, storeId, setStoreId }: Props) {
    const [stores, setStores] = useState<{ id: string, name: string }[]>([])

    useEffect(() => {
        getLamiaStores().then(res => {
            if (res.success) setStores(res.data || [])
        })
    }, [])

    const presets = [
        { label: "Tüm Zamanlar", getValue: () => ({ from: new Date(2023, 0, 1), to: new Date() }) },
        { label: "Bu Hafta", getValue: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: endOfWeek(new Date(), { weekStartsOn: 1 }) }) },
        { label: "Geçen Ay", getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
        { label: "Bu Ay", getValue: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
        { label: "Geçen Yıl", getValue: () => ({ from: startOfYear(subDays(new Date(), 365)), to: endOfYear(subDays(new Date(), 365)) }) },
        { label: "Bu Yıl", getValue: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
    ]

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full bg-white p-1 rounded-xl">

            {/* Store Filter */}
            <div className="w-full sm:w-[200px]">
                <Select value={storeId} onValueChange={setStoreId}>
                    <SelectTrigger className="bg-slate-50 border-0 focus:ring-0 font-medium text-slate-700 h-10 w-full">
                        <SelectValue placeholder="Tüm Mağazalar" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Mağazalar</SelectItem>
                        {stores.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            {/* Quick Date Presets as Select */}
            <div className="w-full sm:w-[180px]">
                <Select onValueChange={(val) => {
                    const preset = presets.find(p => p.label === val)
                    if (preset) setDateRange(preset.getValue())
                }}>
                    <SelectTrigger className="bg-slate-50 border-0 focus:ring-0 font-medium text-slate-700 h-10 w-full">
                        <SelectValue placeholder="Hızlı Tarih Filtrele" />
                    </SelectTrigger>
                    <SelectContent>
                        {presets.map(p => (
                            <SelectItem key={p.label} value={p.label}>{p.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            {/* Custom Date Range Display/Picker */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"ghost"}
                            className={cn(
                                "w-full sm:w-[240px] justify-start text-left font-normal bg-slate-50 border-0 h-10 hover:bg-slate-100",
                                !dateRange && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                            {dateRange?.from ? (
                                dateRange.to ? (
                                    <span className="text-slate-700 font-medium">
                                        {format(dateRange.from, "d MMM y", { locale: tr })} -{" "}
                                        {format(dateRange.to, "d MMM y", { locale: tr })}
                                    </span>
                                ) : (
                                    <span className="text-slate-700 font-medium">{format(dateRange.from, "d MMM y", { locale: tr })}</span>
                                )
                            ) : (
                                <span>Tarih seçin</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange as any}
                            onSelect={(range: any) => {
                                if (range?.from) {
                                    setDateRange({ from: range.from, to: range.to || range.from })
                                }
                            }}
                            numberOfMonths={2}
                            locale={tr}
                        />
                    </PopoverContent>
                </Popover>
            </div>

        </div>
    )
}
