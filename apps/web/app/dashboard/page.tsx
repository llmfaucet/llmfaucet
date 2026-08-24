"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowUpRight, KeyRound, Server, ShieldCheck } from "lucide-react"
import { api, publicApiEndpoint } from "@/lib/api-client"
import type { AccountResponse, StatusResponse, UsageResponse } from "@/lib/api-types"
import { Button } from "@/components/ui/button"
import { UsageMeter } from "@/components/usage-meter"
import { EmptyState, ErrorState, LoadingState } from "@/components/data-states"
import { CodeBlock } from "@/components/code-block"

export default function DashboardPage() {
  const [account, setAccount] = useState<AccountResponse | null>(null)
  const [usage, setUsage] = useState<UsageResponse | null>(null)
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [error, setError] = useState("")
  useEffect(() => {
    Promise.all([api.account(), api.usage().catch(() => null), api.status().catch(() => null)])
      .then(([nextAccount, nextUsage, nextStatus]) => { setAccount(nextAccount); setUsage(nextUsage); setStatus(nextStatus) })
      .catch((reason: Error) => setError(reason.message))
  }, [])
  if (error && !account) return <ErrorState message={error} />
  if (!account) return <LoadingState label="Loading your developer console" />
  const activeKeys = account.keys.filter((key) => key.status === "active")
  const healthy = status?.providers?.filter((provider) => provider.status?.toLowerCase() === "operational" || provider.status?.toLowerCase() === "healthy").length
  const total = status?.providers?.length
  return <div className="space-y-8">
    <div><p className="text-sm text-muted-foreground">Developer console</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, @{account.user.githubLogin}</h1><p className="mt-3 text-muted-foreground">A clear view of your access, usage, and the public router.</p></div>
    <div className="grid gap-4 md:grid-cols-3">
      <section className="rounded-xl border border-border bg-card p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Current plan</p><ShieldCheck className="size-4 text-emerald-600" /></div><p className="mt-3 text-2xl font-semibold capitalize">{account.entitlement.plan.replace("_", " ")}</p><p className="mt-2 text-sm text-muted-foreground">{account.entitlement.requestsPerDay} requests/day · priority {account.entitlement.queuePriority}</p></section>
      <section className="rounded-xl border border-border bg-card p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Requests today</p><Server className="size-4 text-muted-foreground" /></div>{usage ? <><div className="mt-4"><UsageMeter used={usage.used} limit={usage.limit} /></div><p className="mt-3 text-xs text-muted-foreground">Resets {new Date(usage.resetAt).toUTCString()}</p></> : <p className="mt-3 text-sm text-muted-foreground">Usage is unavailable until the endpoint responds.</p>}</section>
      <section className="rounded-xl border border-border bg-card p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">API keys</p><KeyRound className="size-4 text-muted-foreground" /></div><p className="mt-3 text-2xl font-semibold">{activeKeys.length}</p><Button asChild variant="link" className="mt-1 h-auto p-0"><Link href="/dashboard/keys">Manage keys <ArrowUpRight className="ml-1 size-3" /></Link></Button></section>
    </div>
    <section className="rounded-xl border border-border bg-card p-6"><div className="flex items-center justify-between gap-4"><div><h2 className="font-semibold">Router status</h2><p className="mt-1 text-sm text-muted-foreground">Public provider health changes as capacity changes.</p></div><Link className="text-sm underline underline-offset-4" href="/status">View status</Link></div><p className="mt-5 text-lg font-medium">{healthy !== undefined && total !== undefined ? `${healthy} / ${total} sources healthy` : "Live status unavailable"}</p></section>
    <section className="rounded-xl border border-border bg-card p-6"><h2 className="font-semibold">Quick start</h2><p className="mt-2 text-sm text-muted-foreground">Use your personal key from the API keys page with an OpenAI-compatible client. Raw keys are only shown once at creation.</p><div className="mt-5"><CodeBlock code={`baseURL: "${publicApiEndpoint}/v1"\nmodel: "auto:coding"`} language="setup" /></div><div className="mt-4 flex flex-wrap gap-3"><Button asChild><Link href="/docs/quickstart">Read quickstart</Link></Button><Button asChild variant="outline"><Link href="/dashboard/models">Browse live models</Link></Button></div></section>
    {!usage?.days?.length ? <EmptyState title="No recent activity" body="Metadata-only request activity will appear here when the usage endpoint provides it." /> : null}
  </div>
}
