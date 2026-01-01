import { getAnalysisData } from "@/app/actions/analysis"
import AnalysisView from "@/components/analysis-view"
import { LamiaAnalysisView } from "@/components/lamia/lamia-analysis-view"

export default async function AnalysisPage({ params }: { params: Promise<{ brand: string }> }) {
    const { brand } = await params

    // Lamiaferis Special Analysis Page
    if (brand.toLowerCase() === "lamiaferis") {
        return <LamiaAnalysisView />
    }

    // Standard Analysis for other brands
    const res = await getAnalysisData(brand)

    if (!res.success || !res.data) {
        return <div className="p-8 text-center text-red-600">Veri yüklenirken hata oluştu: {res.error}</div>
    }

    return <AnalysisView data={res.data} />
}
