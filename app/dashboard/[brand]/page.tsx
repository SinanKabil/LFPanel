import { redirect } from "next/navigation"

export default async function BrandDashboard({ params }: { params: Promise<{ brand: string }> }) {
    // Default redirect to analysis
    const { brand } = await params
    redirect(`/dashboard/${brand}/analysis`)
}
