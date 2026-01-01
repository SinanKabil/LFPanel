"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

type Props = {
    dailyTrend: any[]
    storeTrend: any[]
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#6366f1"]

export function AnalysisCharts({ dailyTrend, storeTrend }: Props) {
    // Extract unique store names for lines
    const storeNames = storeTrend.length > 0
        ? Object.keys(storeTrend[0]).filter(k => k !== "date")
        : []

    return (
        <div className="space-y-8">

            {/* Income vs Expense Trend */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-800">Gelir / Gider Trendi</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dailyTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#64748b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#64748b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    formatter={(value: number) => value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="income"
                                    name="Gelir"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                    connectNulls={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="expense"
                                    name="Gider"
                                    stroke="#ef4444"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                    connectNulls={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Store Based Trend */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-800">Mağaza Bazlı Gelir Trendi</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={storeTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#64748b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#64748b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    formatter={(value: number) => value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                                />
                                <Legend />
                                {storeNames.map((store, index) => (
                                    <Line
                                        key={store}
                                        type="monotone"
                                        dataKey={store}
                                        name={store}
                                        stroke={COLORS[index % COLORS.length]}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 5 }}
                                        connectNulls={false}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

        </div>
    )
}
