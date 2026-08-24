"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface StackedLogosProps {
  logoGroups: React.ReactNode[][]
  duration?: number
  stagger?: number
  logoWidth?: string
  className?: string
}

export const StackedLogos = ({
  logoGroups,
  duration = 30,
  stagger = 0,
  logoWidth = "200px",
  className,
}: StackedLogosProps) => {
  const itemCount = logoGroups[0]?.length || 0
  const columns = logoGroups.length
  const containerRef = React.useRef<HTMLDivElement>(null)
  const gridRef = React.useRef<HTMLDivElement>(null)
  const [activeIndexes, setActiveIndexes] = React.useState(() => logoGroups.map(() => 0))

  React.useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const interval = window.setInterval(() => {
      setActiveIndexes((current) => current.map((index, groupIndex) => {
        const length = logoGroups[groupIndex]?.length ?? 0
        return length > 0 ? (index + 1) % length : 0
      }))
    }, Math.max(700, (duration * 1000) / Math.max(itemCount, 1)))
    return () => window.clearInterval(interval)
  }, [duration, itemCount, logoGroups])

  const handleMouseMove = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !gridRef.current) return
    const rect = gridRef.current.getBoundingClientRect()
    containerRef.current.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`)
    containerRef.current.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`)
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn("stacked-logos relative w-full", className)}
      style={{ "--duration": duration, "--items": itemCount, "--lists": columns, "--stagger": stagger, "--logo-width": logoWidth, "--cell-height": "128px" } as React.CSSProperties}
      onMouseMove={handleMouseMove}
    >
      <div ref={gridRef} className="relative mx-auto grid w-full" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        <div className="stacked-logos__glow pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300" style={{ background: "radial-gradient(500px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(251,191,36,0.1), transparent 70%)" }} />
        <div className="stacked-logos__border-glow pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-300" style={{ background: "radial-gradient(600px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(251,191,36,1), transparent 40%)", maskImage: `repeating-linear-gradient(to right, transparent, transparent calc(${logoWidth} - 1px), black calc(${logoWidth} - 1px), black ${logoWidth}), linear-gradient(to bottom, black 0, black 1px, transparent 1px, transparent calc(100% - 1px), black calc(100% - 1px), black 100%)`, WebkitMaskImage: `repeating-linear-gradient(to right, transparent, transparent calc(${logoWidth} - 1px), black calc(${logoWidth} - 1px), black ${logoWidth}), linear-gradient(to bottom, black 0, black 1px, transparent 1px, transparent calc(100% - 1px), black calc(100% - 1px), black 100%)` }} />
        {logoGroups.map((logos, groupIndex) => (
          <div key={groupIndex} className="stacked-logos__cell relative grid" style={{ gridTemplate: "1fr / 1fr", "--index": groupIndex } as React.CSSProperties}>
            <div className="absolute top-0 bottom-0 right-0 w-px bg-zinc-200 dark:bg-zinc-800" />
            <div className="absolute left-0 right-0 bottom-0 h-px bg-zinc-200 dark:bg-zinc-800" />
            <div className="absolute left-0 right-0 top-0 h-px bg-zinc-200 dark:bg-zinc-800" />
            {groupIndex === 0 && <div className="absolute top-0 bottom-0 left-0 w-px bg-zinc-200 dark:bg-zinc-800" />}
            {logos.map((logo, logoIndex) => (
              <div key={logoIndex} className="stacked-logos__item col-start-1 row-start-1 grid place-items-center px-3 py-8 transition-none sm:px-5 sm:py-12" data-logo data-active={activeIndexes[groupIndex] === logoIndex} aria-hidden={activeIndexes[groupIndex] !== logoIndex} style={{ "--i": logoIndex, "--index": groupIndex, "--stagger": stagger } as React.CSSProperties}>
                <div className="stacked-logos__logo flex h-8 w-full items-center justify-center [&>img]:h-full [&>img]:w-auto [&>img]:object-contain [&>img]:grayscale [&>img]:brightness-50 dark:[&>img]:brightness-125 dark:[&>img]:invert">{logo}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default StackedLogos
