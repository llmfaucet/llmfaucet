"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { AnimatedThemeToggler as MagicThemeToggler } from "@/components/ui/animated-theme-toggler"
import { api, apiBase } from "@/lib/api-client"

// The installed Magic UI component owns document.startViewTransition and
// prefers-reduced-motion behavior; this wrapper keeps next-themes authoritative.

export function AnimatedThemeToggler() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted || (resolvedTheme !== "light" && resolvedTheme !== "dark")) return <span className="size-10" aria-hidden="true" />
  return <MagicThemeToggler theme={resolvedTheme} duration={350} variant="circle" onThemeChange={(next) => { setTheme(next); if (apiBase) void api.updatePreferences({ theme: next }).catch(() => undefined) }} aria-label={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"} />
}
