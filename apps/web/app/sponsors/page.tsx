"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Heart } from "lucide-react"
import { MarketingShell } from "@/components/marketing-shell"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api-client"

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<{ current: string[]; special: string[] } | null>(null)

  useEffect(() => {
    api.publicSponsors().then((result) => setSponsors({ current: result.currentSponsors ?? result.sponsors, special: result.specialSponsors ?? [] })).catch(() => setSponsors(null))
  }, [])

  const directory = (title: string, values: string[], featured = false) => <section className="mt-10"><p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{title}</p>{values.length === 0 ? <p className="mt-4 rounded-lg border border-border p-6 text-sm text-muted-foreground">No sponsors are reported in this group.</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{values.map((login) => <a key={login} href={`https://github.com/${encodeURIComponent(login)}`} className={`flex items-center gap-3 rounded-lg border p-4 transition-colors hover:border-emerald-500 ${featured ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border'}`}><img src={`https://github.com/${encodeURIComponent(login)}.png?size=96`} alt="" aria-hidden="true" className="size-10 rounded-full" /><span className="font-mono text-sm">@{login}</span></a>)}</div>}</section>
  return <MarketingShell><section className="mx-auto max-w-6xl px-5 py-20 lg:px-8"><div className="max-w-2xl"><p className="font-mono text-xs uppercase tracking-widest text-emerald-600">GitHub Sponsors</p><h1 className="mt-4 text-5xl font-semibold tracking-tight">Help keep the faucet flowing.</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">Sponsors help fund infrastructure, provider testing, documentation, and maintenance. Sponsorship provides higher fair-use limits and priority access—not guaranteed models or unlimited usage.</p><Button asChild className="mt-7"><a href="https://github.com/sponsors/justinedevs"><Heart className="mr-2 size-4" />Support justinedevs</a></Button></div><div className="mt-20 border-t border-border pt-8"><div className="flex items-center justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Sponsor directory</p><h2 className="mt-3 text-2xl font-semibold">People supporting open development.</h2></div><Link href="/" className="inline-flex items-center text-sm text-emerald-600 hover:underline">Back to home <ArrowRight className="ml-2 size-4" /></Link></div>{sponsors === null ? <p className="mt-8 rounded-lg border border-border p-6 text-sm text-muted-foreground">Public sponsor data is unavailable right now. View the live sponsor list on GitHub.</p> : <>{directory('Special thanks', sponsors.special, true)}{directory('Current sponsors', sponsors.current)}</>}<p className="mt-8 text-sm text-muted-foreground">Sponsor data is sourced from the configured public GitHub Sponsors integration. It is not inferred or fabricated.</p></div></section></MarketingShell>
}
