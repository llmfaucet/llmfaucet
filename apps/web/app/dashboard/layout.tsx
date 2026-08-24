import type { ReactNode } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ThemePreferenceSync } from "@/components/theme-preference-sync"
import { FirstRunOnboarding } from "@/components/onboarding/first-run-onboarding"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <SidebarProvider style={{ "--sidebar-width": "calc(var(--spacing) * 64)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}><AppSidebar variant="inset" /><SidebarInset><DashboardHeader /><div className="@container/main flex min-h-0 flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8"><ThemePreferenceSync />{children}</div><FirstRunOnboarding /></SidebarInset></SidebarProvider>
}
