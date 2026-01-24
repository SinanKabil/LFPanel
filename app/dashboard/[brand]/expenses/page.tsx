import { getExpenses, getExpenseCategories } from "@/app/actions/expenses"
import ExpensesView from "@/components/expenses/expenses-view"
import { Store } from "@prisma/client"

export default async function ExpensesPage({ params }: { params: Promise<{ brand: string }> }) {
    const { brand } = await params

    const brandMap: Record<string, Store> = {
        "radiant-jewelry-gift": Store.RADIANT_JEWELRY_GIFT,
        "the-trendy-outfitters": Store.THE_TRENDY_OUTFITTERS,
        "lamiaferis": Store.LAMIAFERIS
    }

    const normalizedBrand = brand.toLowerCase()

    // Allow "etsy" as a generic brand for the main panel
    let store: Store | "etsy" | undefined = brandMap[normalizedBrand]

    if (normalizedBrand === "etsy") {
        store = "etsy"
    }

    if (!store) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-red-600">Hata</h1>
                <p className="text-slate-600">Geçersiz marka: {brand}</p>
            </div>
        )
    }

    // Determine category type based on store
    const categoryType = store === Store.LAMIAFERIS ? "LAMIAFERIS" : "ETSY"

    const [expensesResult, categoriesResult] = await Promise.all([
        getExpenses(store),
        getExpenseCategories(categoryType)
    ])

    // Serialize dates to prevent "Application Error" (Date objects cannot be passed to Client Components in some cases)
    const rawExpenses = expensesResult.success && expensesResult.data ? expensesResult.data : []
    const expenses = rawExpenses.map(e => ({
        ...e,
        date: e.date.toISOString(),
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString()
    }))

    const rawCategories = categoriesResult.success && categoriesResult.data ? categoriesResult.data : []
    const categories = rawCategories.map(c => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString()
    }))

    return <ExpensesView expenses={expenses} categories={categories} store={store as string} />
}
