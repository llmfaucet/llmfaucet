"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { AnimatedThemeToggler } from "@/components/animated-theme-toggler"

const titles: Record<string, string> = { "/dashboard": "Overview", "/dashboard/keys": "API Keys", "/dashboard/usage": "Usage", "/dashboard/models": "Models", "/dashboard/billing": "Billing & Sponsors", "/dashboard/tester": "Early tester", "/dashboard/settings": "Settings" }
export function DashboardHeader() { const pathname = usePathname(); return <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/60"><div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6"><SidebarTrigger className="-ml-1" /><Separator orientation="vertical" className="mx-2 h-4" /><h1 className="text-sm font-medium">{titles[pathname] ?? "Developer console"}</h1><div className="ml-auto"><AnimatedThemeToggler /></div></div></header> }
