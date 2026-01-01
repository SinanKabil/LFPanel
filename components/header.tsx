"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { logoutAction } from "@/app/actions/auth"

export function Header() {
    const pathname = usePathname()
    // Extract brand from path: /dashboard/etsy/... -> etsy
    const segments = pathname.split("/")
    const brand = segments[2] || "etsy" // default to etsy if not found

    const isLamia = brand.toLowerCase() === "lamiaferis"

    const navItems = isLamia ? [
        { name: "Analiz", href: `/dashboard/${brand}/analysis` },
        { name: "Gelir", href: `/dashboard/${brand}/income` },
        { name: "Gider", href: `/dashboard/${brand}/expenses` },
        { name: "Veri & Ayarlar", href: `/dashboard/${brand}/settings` },
    ] : [
        { name: "Analiz", href: `/dashboard/${brand}/analysis` },
        { name: "Satışlar", href: `/dashboard/${brand}/sales` },
        { name: "Mesajlar", href: `/dashboard/${brand}/messages` },
        { name: "Fiyat Hesaplama", href: `/dashboard/${brand}/calculator` },
        { name: "Giderler", href: `/dashboard/${brand}/expenses` },
        { name: "Ayarlar", href: `/dashboard/${brand}/settings` },
    ]

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="w-full flex h-16 items-center justify-between px-6">
                {/* Left: Logo */}
                <div className="flex items-center gap-2">
                    <Link href="/" className="font-bold text-xl text-slate-900 tracking-widest hover:text-orange-600 transition-colors">
                        LF PANEL
                    </Link>
                </div>

                {/* Right: Menu */}
                <nav className="flex items-center gap-1">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-slate-100",
                                    isActive ? "text-orange-600 bg-slate-50" : "text-slate-600"
                                )}
                            >
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>
            </div>
        </header>
    )
}
