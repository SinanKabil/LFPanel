"use client"

import { Coins } from "lucide-react"
import { PosTable } from "./pos-table"
import { CashTable } from "./cash-table"
import { SummaryTable } from "./summary-table"

type IncomeViewProps = {
    posTransactions: any[]
    cashTransactions: any[]
    stores: any[]
}

export default function IncomeView({ posTransactions, cashTransactions, stores }: IncomeViewProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-slate-100 rounded-lg">
                    <Coins className="h-6 w-6 text-slate-900" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Gelir</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-8 items-start">
                <div className="space-y-8">
                    <PosTable transactions={posTransactions} />
                    <CashTable transactions={cashTransactions} />
                </div>

                <div>
                    <SummaryTable
                        posTransactions={posTransactions}
                        cashTransactions={cashTransactions}
                        stores={stores}
                    />
                </div>
            </div>
        </div>
    )
}
