import type { ReactNode } from "react"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"
import { WaitlistCta } from "./waitlist-cta"

export function MarketingShell({ children, includeWaitlistCta = false, fullViewport = false }: { children: ReactNode; includeWaitlistCta?: boolean; fullViewport?: boolean }) {
  return <div className={`${fullViewport ? "flex h-svh flex-col overflow-hidden" : "min-h-screen"} bg-background text-foreground`}><SiteHeader /><main id="main" className={fullViewport ? "min-h-0 flex-1 overflow-hidden" : undefined}>{children}{includeWaitlistCta && <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8"><WaitlistCta /></section>}</main>{!fullViewport && <SiteFooter />}</div>
}
