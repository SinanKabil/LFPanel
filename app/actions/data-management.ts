"use server"

import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"

export async function exportData(type: "pos" | "cash" | "expense" | "etsy_sales" | "etsy_expense", brand: string) {
    try {
        let data: any[] = []

        if (type === "pos") {
            const transactions = await prisma.posTransaction.findMany({
                include: { store: true },
                orderBy: { date: "desc" }
            })
            data = transactions.map(t => ({
                Tarih: t.date,
                Mağaza: t.store?.name,
                Tutar: t.amount,
                Komisyon_Oranı: t.commissionRateSnapshot,
                Net_Tutar: t.net,
                Not: t.note
            }))
        } else if (type === "cash") {
            const transactions = await prisma.cashTransaction.findMany({
                orderBy: { date: "desc" }
            })
            data = transactions.map(t => ({
                Tarih: t.date,
                Tutar: t.amount,
                Açıklama: t.note
            }))
        } else if (type === "expense") {
            // Filter by brand logic if needed, currently assumes store enum or similar
            // Assuming Lamiaferis for now as per context
            const expenses = await prisma.expense.findMany({
                where: { store: "LAMIAFERIS" },
                orderBy: { date: "desc" }
            })
            data = expenses.map(e => ({
                Tarih: e.date,
                Kategori: e.category,
                Tutar_TL: e.amountTL,
                Açıklama: e.description
            }))
        } else if (type === "etsy_sales") {
            const sales = await prisma.sale.findMany({
                include: { product: true },
                orderBy: { date: "desc" }
            })
            data = sales.map(s => ({
                Tarih: s.date,
                Mağaza: s.store,
                Tip: s.type,
                Ürün: s.product?.name,
                Adet: s.quantity,
                SiparişNo: s.orderNo,
                Ödenen_USD: s.buyerPaid,
                Kesintiler_USD: s.feesCredits,
                Toplam_TL: s.totalSalePriceTL,
                Maliyet_USD: s.productCost,
                Kargo_USD: s.shippingCost,
                Kar_USD: s.profitUSD,
                Kar_TL: s.profitTL
            }))
        } else if (type === "etsy_expense") {
            const expenses = await prisma.expense.findMany({
                where: {
                    store: { not: "LAMIAFERIS" }
                },
                orderBy: { date: "desc" }
            })
            data = expenses.map(e => ({
                Tarih: e.date,
                Mağaza: e.store,
                Kategori: e.category,
                Tutar_USD: e.amountUSD,
                Tutar_TL: e.amountTL,
                Kur: e.exchangeRate,
                Açıklama: e.description
            }))
        }

        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.json_to_sheet(data)
        XLSX.utils.book_append_sheet(wb, ws, "Veriler")

        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
        const base64 = buf.toString("base64")

        return { success: true, data: base64, filename: `lamia_${type}_export.xlsx` }

    } catch (error) {
        console.error("Export Error:", error)
        return { success: false, error: "Dışa aktarma başarısız oldu." }
    }
}

export async function getSampleExcel(type: "pos" | "cash" | "expense" | "etsy_sales" | "etsy_expense") {
    try {
        let data: any[] = []
        if (type === "pos") {
            data = [{ Tarih: "2024-01-01", Mağaza: "Mağaza Adı", Tutar: 1000, Komisyon_Oranı: 3.5, Not: "Opsiyonel" }]
        } else if (type === "cash") {
            data = [{ Tarih: "2024-01-01", Tutar: 500, Açıklama: "Satış Açıklaması" }]
        } else if (type === "expense") {
            data = [{ Tarih: "2024-01-01", Kategori: "Kargo", Tutar_TL: 150, Açıklama: "Gider Açıklaması" }]
        } else if (type === "etsy_sales") {
            data = [{
                Tarih: "2024-01-01", Mağaza: "RADIANT_JEWELRY_GIFT", Tip: "ORGANIC", Ürün: "Ürün Adı", Adet: 1,
                SiparişNo: "12345", Ödenen_USD: 50, Kesintiler_USD: 5, Toplam_TL: 1500, Maliyet_USD: 10, Kargo_USD: 8,
                Kar_USD: 27, Kar_TL: 810
            }]
        } else if (type === "etsy_expense") {
            data = [{
                Tarih: "2024-01-01", Mağaza: "RADIANT_JEWELRY_GIFT", Kategori: "Reklam",
                Tutar_USD: 20, Tutar_TL: 0, Kur: 30, Açıklama: "Gider"
            }]
        }

        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.json_to_sheet(data)
        XLSX.utils.book_append_sheet(wb, ws, "Ornek")
        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
        const base64 = buf.toString("base64")
        return { success: true, data: base64, filename: `ornek_${type}_sablon.xlsx` }
    } catch (error) {
        return { success: false, error: "Örnek dosya oluşturulamadı." }
    }
}

export async function importData(formData: FormData, type: "pos" | "cash" | "expense" | "etsy_sales" | "etsy_expense") {
    try {
        const file = formData.get("file") as File
        if (!file) return { success: false, error: "Dosya yüklenemedi." }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const wb = XLSX.read(buffer, { type: "buffer" })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(ws)

        if (jsonData.length === 0) return { success: false, error: "Dosya boş veya format hatalı." }

        let count = 0

        if (type === "pos") {
            const stores = await prisma.lamiaStore.findMany()
            const storeMap = new Map(stores.map(s => [s.name.trim().toLowerCase(), s.id]))

            // Fetch existing commission rates
            const rates = await prisma.commissionRate.findMany()
            // Map rate value (e.g. 3.5) to ID
            const rateMap = new Map(rates.map(r => [r.rate, r.id]))

            const transactionsToCreate = []

            for (const row of jsonData as any[]) {
                const dateStr = row["Tarih"]
                const storeName = row["Mağaza"]
                const amount = parseFloat(row["Tutar"])
                const rateVal = parseFloat(row["Komisyon_Oranı"])
                const note = row["Not"]

                if (!dateStr || !storeName || isNaN(amount) || isNaN(rateVal)) continue

                // 1. Resolve Store
                let storeId = storeMap.get(storeName.trim().toLowerCase())
                if (!storeId) {
                    // Option: Create store if missing, or skip? 
                    // For safety, let's create it to ensure data import succeeds
                    const newStore = await prisma.lamiaStore.create({ data: { name: storeName.trim() } })
                    storeId = newStore.id
                    storeMap.set(newStore.name.toLowerCase(), newStore.id)
                }

                // 2. Resolve Commission Rate
                let commissionRateId = rateMap.get(rateVal)
                if (!commissionRateId) {
                    // Create new rate if not found
                    const newRate = await prisma.commissionRate.create({
                        data: {
                            rate: rateVal,
                            label: `%${rateVal} (Import)`
                        }
                    })
                    commissionRateId = newRate.id
                    rateMap.set(rateVal, newRate.id)
                }

                // 3. Calculate Net
                // Net = Amount - (Amount * Rate / 100)
                const commissionAmount = amount * (rateVal / 100)
                const net = amount - commissionAmount

                transactionsToCreate.push({
                    date: new Date(dateStr),
                    storeId,
                    amount,
                    commissionRateId,
                    commissionRateSnapshot: rateVal,
                    net,
                    note: note ? String(note) : null
                })
            }

            if (transactionsToCreate.length > 0) {
                await prisma.posTransaction.createMany({ data: transactionsToCreate })
                count = transactionsToCreate.length
            }
        } else if (type === "etsy_sales") {
            const products = await prisma.product.findMany()
            const productMap = new Map(products.map(p => [p.name.trim().toLowerCase(), p.id])) // Match by Name

            const salesData = []
            for (const row of jsonData as any[]) {
                const date = new Date(row["Tarih"])
                const store = row["Mağaza"] as any // Cast to Enum later or validate
                const saleType = row["Tip"] as any
                const productName = row["Ürün"]
                const qty = parseInt(row["Adet"])

                // Validate Store Enum (basic check)
                if (!["RADIANT_JEWELRY_GIFT", "THE_TRENDY_OUTFITTERS"].includes(store)) continue // Skip invalid stores

                let productId = productMap.get(productName?.trim().toLowerCase())
                if (!productId) {
                    // Create dummy product or skip? 
                    // Let's create a placeholder product to avoid failure
                    const newProd = await prisma.product.create({
                        data: { name: productName || "Unknown Product" }
                    })
                    productId = newProd.id
                    productMap.set(productName?.trim().toLowerCase(), productId)
                }

                salesData.push({
                    date,
                    store,
                    type: saleType || "ORGANIC",
                    productId,
                    quantity: qty || 1,
                    orderNo: row["SiparişNo"] ? String(row["SiparişNo"]) : "Unknown",
                    buyerPaid: parseFloat(row["Ödenen_USD"] || "0"),
                    feesCredits: parseFloat(row["Kesintiler_USD"] || "0"),
                    totalSalePriceTL: parseFloat(row["Toplam_TL"] || "0"),
                    productCost: parseFloat(row["Maliyet_USD"] || "0"),
                    shippingCost: parseFloat(row["Kargo_USD"] || "0"),
                    profitUSD: parseFloat(row["Kar_USD"] || "0"),
                    profitTL: parseFloat(row["Kar_TL"] || "0")
                })
            }

            if (salesData.length > 0) {
                await prisma.sale.createMany({ data: salesData })
                count = salesData.length
            }

        } else if (type === "etsy_expense") {
            const expensesData = []
            for (const row of jsonData as any[]) {
                const date = new Date(row["Tarih"])
                if (isNaN(date.getTime())) continue

                const store = row["Mağaza"]
                if (!["RADIANT_JEWELRY_GIFT", "THE_TRENDY_OUTFITTERS"].includes(store)) continue

                expensesData.push({
                    date,
                    store: store as any,
                    category: row["Kategori"] || "Genel",
                    amountUSD: parseFloat(row["Tutar_USD"] || "0"),
                    amountTL: parseFloat(row["Tutar_TL"] || "0"),
                    exchangeRate: parseFloat(row["Kur"] || "0"),
                    description: row["Açıklama"]
                })
            }
            if (expensesData.length > 0) {
                await prisma.expense.createMany({ data: expensesData })
                count = expensesData.length
            }
        }

        return { success: true, count }

    } catch (error) {
        console.error("Import Error:", error)
        return { success: false, error: "İçe aktarma sırasında hata oluştu." }
    }
}
