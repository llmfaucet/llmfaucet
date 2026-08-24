import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return <main className="flex min-h-screen items-center justify-center px-6"><div className="max-w-md text-center"><p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-600">404</p><h1 className="mt-4 text-3xl font-semibold">Page not found.</h1><p className="mt-3 text-muted-foreground">The route you requested does not exist.</p><Button asChild className="mt-6"><Link href="/">Return home</Link></Button></div></main>
}
