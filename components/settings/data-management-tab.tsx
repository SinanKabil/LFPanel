"use client"

import { DataSection } from "./data-section"

type Props = {
    brand: string
}

export function DataManagementTab({ brand }: Props) {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <DataSection
                title="POS İşlemleri"
                description="POS cihazı gelir verilerini yönetin."
                type="pos"
                brand={brand}
            />
            <DataSection
                title="Nakit İşlemleri"
                description="Elden alınan nakit gelirleri yönetin."
                type="cash"
                brand={brand}
            />
            <DataSection
                title="Gider Kalemleri"
                description="İşletme giderlerini yönetin."
                type="expense"
                brand={brand}
            />
        </div>
    )
}
