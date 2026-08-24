"use client"

import Link from "next/link"
import { Menu } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Brand } from "@/components/brand"
import { Button } from "@/components/ui/button"
import { AnimatedThemeToggler } from "@/components/animated-theme-toggler"
import { GitHubStarsWheel } from "@/components/animate-ui/components/animate/github-stars-wheel"

export function SiteHeader() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="grid h-16 w-full grid-cols-[1fr_auto_1fr] items-center gap-6 px-5 lg:px-8">
          <Brand />
          <nav className="hidden items-center justify-self-center gap-6 text-sm text-muted-foreground md:flex" aria-label="Primary">
            <Link href="/docs" className="hover:text-foreground">Docs</Link>
            <Link href="/status" className="hover:text-foreground">Status</Link>
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          </nav>
          <div className="flex items-center justify-self-end gap-2">
            <AnimatedThemeToggler />
            <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link href="/login">Sign in</Link></Button>
            <a href="https://github.com/llmfaucet/llmfaucet/stargazers" className="hidden items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground sm:inline-flex" aria-label="View llmfaucet GitHub stargazers">
              <span className="inline-flex h-[35px] w-28 overflow-hidden">
                <span className="block -translate-y-[70px]">
                  <GitHubStarsWheel username="llmfaucet" repo="llmfaucet" delay={0} direction="btt" step={1} sideItemsCount={2} />
                </span>
              </span>
            </a>
            <Sheet>
              <SheetTrigger render={<Button variant="outline" size="icon" className="md:hidden" aria-label="Open navigation" />}><Menu className="size-4" /></SheetTrigger>
              <SheetContent side="right" className="w-[min(22rem,90vw)]">
                <SheetHeader><SheetTitle>llmfaucet</SheetTitle><SheetDescription>Developer tools and access.</SheetDescription></SheetHeader>
                <nav className="flex flex-col gap-2 px-4" aria-label="Mobile primary">
                  <Link className="rounded-md px-3 py-2 text-sm hover:bg-muted" href="/docs">Docs</Link>
                  <Link className="rounded-md px-3 py-2 text-sm hover:bg-muted" href="/status">Status</Link>
                  <Link className="rounded-md px-3 py-2 text-sm hover:bg-muted" href="/pricing">Pricing</Link>
                  <a className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted" href="https://github.com/llmfaucet/llmfaucet/stargazers" aria-label="View llmfaucet GitHub stargazers"><span className="inline-flex h-[35px] w-28 overflow-hidden"><span className="block -translate-y-[70px]"><GitHubStarsWheel username="llmfaucet" repo="llmfaucet" delay={0} direction="btt" step={1} sideItemsCount={2} /></span></span></a>
                  <Link className="rounded-md px-3 py-2 text-sm hover:bg-muted" href="/login">Sign in</Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  )
}
