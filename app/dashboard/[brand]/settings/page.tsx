import { getProducts } from "@/app/actions/settings"
import SettingsView from "@/components/settings/settings-view"

export default async function SettingsPage({ params }: { params: Promise<{ brand: string }> }) {
    const { brand } = await params
    console.log("Rendering SettingsPage...", brand)
    const result = await getProducts()
    const products = result.success ? (result.data || []) : []

    return <SettingsView products={products} brand={brand} />
}
