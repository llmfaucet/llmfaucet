"use client"

import type { ComponentType, ReactNode } from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export interface DynamicStep { id: string; title: string; description: string; icon: ComponentType<{ className?: string }> | ReactNode; content: ReactNode }
export interface ToolbarExpandableProps { steps: DynamicStep[]; badgeText?: string; className?: string; activeStep?: string | null; onActiveStepChange?: (id: string | null) => void }

export default function ToolbarExpandable({ steps, badgeText = "SETTINGS", className, activeStep, onActiveStepChange }: ToolbarExpandableProps) {
  const [internal, setInternal] = useState(steps[0]?.id ?? null)
  const selected = activeStep === undefined ? internal : activeStep
  const current = steps.find((step) => step.id === selected) ?? steps[0]
  return <div className={cn("rounded-2xl border border-border bg-card", className)}><div className="flex flex-wrap items-center gap-2 border-b border-border p-3"><span className="mr-2 rounded-full bg-muted px-2 py-1 font-mono text-[10px] tracking-widest text-muted-foreground">{badgeText}</span>{steps.map((step) => { const Icon = step.icon; return <button type="button" key={step.id} aria-pressed={selected === step.id} onClick={() => { setInternal(step.id); onActiveStepChange?.(step.id) }} className={cn("inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", selected === step.id && "bg-foreground text-background hover:bg-foreground")}>{typeof Icon === "function" ? <Icon className="size-4" /> : Icon}<span className="hidden sm:inline">{step.title}</span></button> })}</div>{current ? <div className="p-5"><h2 className="font-semibold">{current.title}</h2><p className="mt-1 text-sm text-muted-foreground">{current.description}</p><div className="mt-5">{current.content}</div></div> : null}</div>
}
