
import { getPosTransactions, getCashTransactions, getLamiaStores } from "@/app/actions/lamia"
import IncomeView from "@/components/lamia/income-view"

export default async function LamiaIncomePage() {
    console.log("Rendering Lamia Income Page...")
    const [posRes, cashRes, storesRes] = await Promise.all([
        getPosTransactions(),
        getCashTransactions(),
        getLamiaStores()
    ])

    const posTransactionsRaw = posRes.success ? (posRes.data || []) : []
    const cashTransactionsRaw = cashRes.success ? (cashRes.data || []) : []
    const storesRaw = storesRes.success ? (storesRes.data || []) : []

    // Serialize Dates for Client Components
    const posTransactions = JSON.parse(JSON.stringify(posTransactionsRaw))
    const cashTransactions = JSON.parse(JSON.stringify(cashTransactionsRaw))
    const stores = JSON.parse(JSON.stringify(storesRaw))

    return (
        <IncomeView
            posTransactions={posTransactions}
            cashTransactions={cashTransactions}
            stores={stores}
        />
    )
}
