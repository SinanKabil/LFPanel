"use client"

import { DataSection } from "./data-section"

type Props = {
    brand: string
}

export function EtsyDataManagementTab({ brand }: Props) {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <DataSection
                title="Satış Verileri"
                description="Tüm satış geçmişini yönetin."
                type="etsy_sales" // This matches strict type in DataSection props? We need to update DataSection props too or cast.
                brand={brand}
            />
            <DataSection
                title="Gider Verileri"
                description="Firma giderlerini yönetin."
                type="etsy_expense"
                brand={brand}
            />
        </div>
    )
}
