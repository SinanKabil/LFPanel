import { Header } from "@/components/header"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-white text-slate-900 relative flex flex-col font-sans antialiased">
            <Header />
            <main className="flex-1 container py-6 mx-auto">
                {children}
            </main>
        </div>
    )
}
