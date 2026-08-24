"use client"

import { Check, FlaskConical, ShieldCheck } from "lucide-react"
import {
  ExpandableScreen,
  ExpandableScreenContent,
  ExpandableScreenTrigger,
} from "@/components/ui/expandable-screen"
import { WaitlistForm } from "@/components/waitlist-form"
import { WaitlistStackedLogos } from "@/components/waitlist-stacked-logos"

export function WaitlistCta() {
  return (
    <ExpandableScreen
      layoutId="llmfaucet-waitlist"
      triggerRadius="100px"
      contentRadius="24px"
      animationDuration={0.3}
      lockScroll
    >
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-20">
        <div className="relative z-10 flex max-w-2xl flex-col items-center gap-4 text-center sm:gap-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-600">Limited early testing</p>
          <h2 className="max-w-2xl text-4xl font-normal leading-[90%] tracking-[-0.03em] text-foreground sm:text-5xl md:text-6xl">Help test the public AI faucet.</h2>
          <p className="max-w-2xl px-4 text-base leading-[160%] text-muted-foreground sm:text-lg md:text-xl">Join a small developer cohort testing coding-agent compatibility, routing quality, and fair-use limits before wider release.</p>
          <ExpandableScreenTrigger>
            <div className="flex h-[60px] items-center gap-3 rounded-full bg-primary px-6 py-3 text-lg font-medium tracking-[-0.01em] text-primary-foreground sm:px-8 sm:text-xl">
              <FlaskConical className="size-5" aria-hidden="true" />
              Join early tester waitlist
            </div>
          </ExpandableScreenTrigger>
          <p className="text-xs text-muted-foreground">GitHub sign-in required. Sponsorship is never required.</p>
          <WaitlistStackedLogos />
        </div>
      </div>

      <ExpandableScreenContent className="bg-primary">
        <div className="relative z-10 mx-auto flex h-full w-full max-w-[1100px] flex-col items-center gap-8 p-6 sm:p-10 lg:flex-row lg:gap-16 lg:p-16">
          <div className="flex w-full flex-1 flex-col justify-center space-y-3 text-primary-foreground">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary-foreground/70">Early Tester Program</p>
            <h2 className="text-3xl font-medium leading-none tracking-[-0.03em] sm:text-4xl lg:text-5xl">Help shape the public gateway.</h2>
            <p className="pt-4 text-sm leading-7 text-primary-foreground/80 sm:text-base">llmfaucet is opening in small groups while we test routing, coding-agent compatibility, fair-use limits, and provider reliability.</p>
            <div className="space-y-4 pt-4 sm:space-y-5 sm:pt-6">
              {[
                "Controlled preview access and setup guidance",
                "A chance to test real developer workflows",
                "Direct channels for reproducible feedback",
              ].map((item) => (
                <div key={item} className="flex gap-3 sm:gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10 sm:size-12"><Check className="size-5 sm:size-6" aria-hidden="true" /></div>
                  <p className="text-sm leading-[150%] text-primary-foreground/90 sm:text-base">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-primary-foreground/20 pt-6 sm:mt-8 sm:pt-8">
              <div className="flex gap-3 text-sm leading-6 text-primary-foreground/80"><ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><p>Sponsorship is not required for selection. Preview capacity, models, routes, and limits may change.</p></div>
            </div>
          </div>
          <div className="w-full flex-1 rounded-2xl bg-background p-5 text-foreground sm:p-8"><WaitlistForm /></div>
        </div>
      </ExpandableScreenContent>
    </ExpandableScreen>
  )
}
