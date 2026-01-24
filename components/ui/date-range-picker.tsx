"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { tr } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

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

interface DatePickerWithRangeProps {
    className?: string
    date: DateRange | undefined
    setDate: (date: DateRange | undefined) => void
}

export function DatePickerWithRange({
    className,
    date,
    setDate,
}: DatePickerWithRangeProps) {
    const [preset, setPreset] = React.useState<string>("last_30")

    const handlePresetChange = (val: string) => {
        setPreset(val)
        const now = new Date()
        switch (val) {
            case "today":
                setDate({ from: now, to: now })
                break
            case "yesterday":
                const yest = addDays(now, -1)
                setDate({ from: yest, to: yest })
                break
            case "last_7":
                setDate({ from: addDays(now, -7), to: now })
                break
            case "last_30":
                setDate({ from: addDays(now, -30), to: now })
                break
            case "this_month":
                setDate({ from: new Date(now.getFullYear(), now.getMonth(), 1), to: now })
                break
            case "last_month":
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
                setDate({ from: lastMonth, to: lastMonthEnd })
                break
            case "this_year":
                setDate({ from: new Date(now.getFullYear(), 0, 1), to: now })
                break
            case "last_year":
                setDate({ from: new Date(now.getFullYear() - 1, 0, 1), to: new Date(now.getFullYear() - 1, 11, 31) })
                break
            case "all_time":
                setDate({ from: new Date(2023, 0, 1), to: now }) // Assumption start date
                break
        }
    }

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[260px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y", { locale: tr })} -{" "}
                                    {format(date.to, "LLL dd, y", { locale: tr })}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y", { locale: tr })
                            )
                        ) : (
                            <span>Tarih aralığı seçin</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white" align="end">
                    <div className="flex flex-col gap-2 p-2 border-b border-slate-100">
                        <Select value={preset} onValueChange={handlePresetChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Hızlı Seçim" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="bg-white">
                                <SelectItem value="today">Bugün</SelectItem>
                                <SelectItem value="yesterday">Dün</SelectItem>
                                <SelectItem value="last_7">Son 7 Gün</SelectItem>
                                <SelectItem value="last_30">Son 30 Gün</SelectItem>
                                <SelectItem value="this_month">Bu Ay</SelectItem>
                                <SelectItem value="last_month">Geçen Ay</SelectItem>
                                <SelectItem value="this_year">Bu Yıl</SelectItem>
                                <SelectItem value="last_year">Geçen Yıl</SelectItem>
                                <SelectItem value="all_time">Tüm Zamanlar</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                        locale={tr}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
