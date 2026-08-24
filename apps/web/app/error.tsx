"use client"

import { Button } from "@/components/ui/button"

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="flex min-h-screen items-center justify-center px-6"><div className="max-w-md text-center"><p className="font-mono text-xs uppercase tracking-[0.2em] text-destructive">Application error</p><h1 className="mt-4 text-3xl font-semibold">Something went wrong.</h1><p className="mt-3 text-muted-foreground">Try loading this page again.</p><Button className="mt-6" onClick={reset}>Try again</Button></div></main>
}
