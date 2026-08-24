"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "motion/react"
import { type FormEvent, useState } from "react"

const sitemap = [
  ["Product", [["Home", "/"], ["Docs", "/docs"], ["Status", "/status"], ["Pricing", "/pricing"]]],
  ["Resources", [["Quickstart", "/docs/quickstart"], ["Agent setup", "/docs/agents"], ["Early testers", "/waitlist"], ["Sponsors", "/sponsors"]]],
  ["Legal", [["Terms", "/terms"], ["Privacy", "/privacy"], ["Fair use", "/docs/limits"]]],
] as const

const footerWord = "LLMFaucet"

function AnimatedFooterLogo() {
  return (
    <div
      role="img"
      aria-label="llmfaucet"
      className="relative flex aspect-[2172/724] w-full items-center justify-center overflow-hidden rounded-lg bg-card"
    >
      <div className="flex items-center gap-[clamp(0.75rem,2vw,2rem)]">
        <motion.div
          initial={{ y: "110%" }}
          animate={{ y: "0%" }}
          transition={{ type: "spring", stiffness: 100, damping: 12, duration: 0.4 }}
          className="relative size-[clamp(3rem,10vw,8rem)] shrink-0"
          aria-hidden="true"
        >
          <Image src="/assets/Logo-mono.png" alt="" fill sizes="128px" className="object-contain dark:invert" />
        </motion.div>
        <span className="overflow-hidden pb-[0.12em] font-sans text-[clamp(2.5rem,10vw,9rem)] font-semibold leading-none tracking-[-0.08em] text-foreground">
          <motion.span
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 12, duration: 0.55, delay: 0.12 }}
            className="inline-block"
          >
            {footerWord}
          </motion.span>
        </span>
      </div>
    </div>
  )
}

export function SiteFooter() {
  const [submitted, setSubmitted] = useState(false)

  const submitNewsletter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    event.currentTarget.reset()
    setSubmitted(true)
    window.setTimeout(() => setSubmitted(false), 2000)
  }

  return (
    <footer className="relative bg-card text-foreground">
      <div className="mx-auto max-w-7xl px-5 pb-3 pt-10 lg:px-8 lg:pt-14">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-md">
            <h2 className="text-2xl font-semibold md:text-4xl">Build with one endpoint.</h2>
            <p className="py-4 text-lg text-muted-foreground md:text-xl">Get practical llmfaucet updates without the noise.</p>
            <form onSubmit={submitNewsletter} className="flex overflow-hidden rounded-full border-2 border-foreground bg-foreground text-background">
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input id="newsletter-email" type="email" name="newsletter_email" required placeholder="Your email *" className="min-w-0 flex-1 bg-transparent px-5 py-3 outline-none placeholder:text-background/60" />
              <button type="submit" className="grid size-12 shrink-0 place-items-center bg-background text-foreground transition-colors hover:bg-primary" aria-label="Subscribe to newsletter">→</button>
            </form>
            {submitted && <p role="status" className="mt-2 text-sm text-muted-foreground">Thanks — you’re subscribed.</p>}
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {sitemap.map(([title, items]) => <nav key={title} aria-label={title}><h3 className="pb-2 text-lg font-semibold">{title}</h3><ul className="space-y-1 text-base text-muted-foreground">{items.map(([label, href]) => <li key={href}><Link href={href} className="transition-colors hover:text-foreground">{label}</Link></li>)}</ul></nav>)}
            <nav aria-label="Social"><h3 className="pb-2 text-lg font-semibold">Social</h3><ul className="space-y-1 text-base text-muted-foreground"><li><a href="https://github.com/llmfaucet/llmfaucet" target="_blank" rel="noreferrer" className="hover:text-foreground">GitHub</a></li><li><a href="https://github.com/sponsors/justinedevs" target="_blank" rel="noreferrer" className="hover:text-foreground">GitHub Sponsors</a></li><li><a href="https://github.com/llmfaucet/llmfaucet/issues" target="_blank" rel="noreferrer" className="hover:text-foreground">Issues</a></li></ul></nav>
          </div>
        </div>
        <div className="mt-10 border-y-2 border-border py-4">
          <AnimatedFooterLogo />
        </div>
        <div className="flex flex-col-reverse justify-between gap-2 py-2 text-sm text-muted-foreground md:flex-row"><span>© {new Date().getFullYear()} llmfaucet. Built for experimentation and development.</span><Link href="/privacy" className="font-semibold hover:text-foreground">Privacy policy</Link></div>
      </div>
    </footer>
  )
}
