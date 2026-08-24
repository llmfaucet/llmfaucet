import { MarketingShell } from "@/components/marketing-shell"
import { AnimatedFooter } from "@/components/ui/animated-footer"
import { WaitlistCta } from "@/components/waitlist-cta"

export default function WaitlistPage() {
  return (
    <MarketingShell>
      <section className="relative min-h-[calc(100svh-4rem)] overflow-hidden px-5 py-8 lg:px-8">
        <AnimatedFooter
          headingLines={[]}
          revealOnScroll={false}
          background="transparent"
          className="pointer-events-none absolute inset-0 z-0"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto max-w-7xl">
          <WaitlistCta />
        </div>
      </section>
    </MarketingShell>
  )
}
