"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { BookOpen, Boxes, ChartNoAxesColumn, CircleDollarSign, FlaskConical, KeyRound, LayoutDashboard, LogOut, Settings, ShieldCheck } from "lucide-react"
import { SiGithub } from "react-icons/si"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { api } from "@/lib/api-client"
import type { AccountResponse } from "@/lib/api-types"

const main = [["Overview", "/dashboard", LayoutDashboard], ["API Keys", "/dashboard/keys", KeyRound], ["Usage", "/dashboard/usage", ChartNoAxesColumn], ["Models", "/dashboard/models", Boxes], ["Billing & Sponsors", "/dashboard/billing", CircleDollarSign], ["Early tester", "/dashboard/tester", FlaskConical], ["Settings", "/dashboard/settings", Settings]] as const

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [account, setAccount] = useState<AccountResponse | null>(null)
  useEffect(() => { api.account().then(setAccount).catch(() => undefined) }, [])
  return <Sidebar collapsible="icon" {...props}>
    <SidebarHeader><SidebarMenu><SidebarMenuItem><SidebarMenuButton size="lg" render={<Link href="/dashboard" />}><Image src="/assets/Logo.png" alt="" width={28} height={28} className="size-7 rounded-md" /><span className="font-mono font-semibold">llmfaucet</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarHeader>
    <SidebarContent>
      <SidebarGroup><SidebarGroupLabel>Console</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{main.map(([label, href, Icon]) => <SidebarMenuItem key={href}><SidebarMenuButton tooltip={label} isActive={pathname === href} render={<Link href={href} />}><Icon /><span>{label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup>
      <SidebarGroup className="mt-auto"><SidebarGroupLabel>Resources</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{[["Documentation", "/docs", BookOpen], ["API status", "/status", ShieldCheck]].map(([label, href, Icon]) => <SidebarMenuItem key={href as string}><SidebarMenuButton tooltip={label as string} render={<Link href={href as string} />}><Icon /><span>{label as string}</span></SidebarMenuButton></SidebarMenuItem>)}<SidebarMenuItem><SidebarMenuButton tooltip="GitHub" render={<a href="https://github.com/llmfaucet/llmfaucet" />}><SiGithub aria-hidden="true" /><span>GitHub</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarGroupContent></SidebarGroup>
    </SidebarContent>
    <SidebarFooter>{account ? <SidebarMenu><SidebarMenuItem><SidebarMenuButton size="lg" tooltip={`Sign out @${account.user.githubLogin}`} onClick={() => void api.logout().then(() => window.location.assign("/"))}><div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-xs font-semibold text-emerald-700">{account.user.githubLogin.slice(0, 1).toUpperCase()}</div><div className="grid flex-1 text-left text-sm leading-tight"><span className="truncate font-medium">@{account.user.githubLogin}</span><span className="truncate text-xs capitalize text-muted-foreground">{account.entitlement.plan.replace("_", " ")}</span></div><LogOut className="size-4" /><span className="sr-only">Sign out</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu> : null}</SidebarFooter>
  </Sidebar>
}
