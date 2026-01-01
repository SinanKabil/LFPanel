```typescript
import { getProducts } from "@/app/actions/settings"
import SettingsView from "@/components/settings/settings-view"

export default async function SettingsPage({ params }: { params: Promise<{ brand: string }> }) {
    const { brand } = await params
    console.log("Rendering SettingsPage...", brand)
    const result = await getProducts()
    const products = result.success ? (result.data || []) : []

    return (
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ayarlar</h1>
            <p className="text-xs text-slate-400">v1.2 (Live Check)</p>
            <SettingsView products={products} brand={brand} />
        </div>
    )
}
```
