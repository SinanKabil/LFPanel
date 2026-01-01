import { getSales } from "@/app/actions/sales"
import { getProducts } from "@/app/actions/settings"
import SalesView from "@/components/sales/sales-view"

export default async function SalesPage({ params }: { params: Promise<{ brand: string }> }) {
    const { brand } = await params
    const salesRes = await getSales(brand)
    const productsRes = await getProducts()

    const sales = salesRes.success && salesRes.data ? salesRes.data : []
    const products = productsRes.success && productsRes.data ? productsRes.data : []

    return <SalesView sales={sales} products={products} />
}
