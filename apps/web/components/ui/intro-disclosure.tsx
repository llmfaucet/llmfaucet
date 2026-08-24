"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

export function IntroDisclosure({ steps, featureId, onComplete, onSkip }: { steps: Array<{ title: string; short_description: string; full_description: string; media?: { type: "image" | "video"; src: string; alt?: string }; action?: { label: string; href?: string; onClick?: () => void } }>; featureId: string; onComplete?: () => void; onSkip?: () => void }) {
  const [index, setIndex] = React.useState(0)
  const [open, setOpen] = React.useState(() => typeof window !== "undefined" && localStorage.getItem(`llmfaucet:disclosure:${featureId}`) !== "hidden")
  if (!open || steps.length === 0) return null
  const step = steps[index]
  const close = (remember: boolean) => { if (remember) localStorage.setItem(`llmfaucet:disclosure:${featureId}`, "hidden"); setOpen(false); onSkip?.() }
  const next = () => { if (index === steps.length - 1) { setOpen(false); onComplete?.() } else setIndex((value) => value + 1) }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={step.title}><div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl"><p className="text-xs text-muted-foreground">{index + 1} of {steps.length}</p><h2 className="mt-3 text-2xl font-semibold">{step.title}</h2><p className="mt-2 text-sm font-medium text-muted-foreground">{step.short_description}</p><p className="mt-4 text-sm leading-6 text-muted-foreground">{step.full_description}</p>{step.action && (step.action.href ? <Button asChild className="mt-5"><a href={step.action.href}>{step.action.label}</a></Button> : <Button className="mt-5" onClick={step.action.onClick}>{step.action.label}</Button>)}<div className="mt-7 flex items-center justify-between"><button type="button" className="text-xs text-muted-foreground underline" onClick={() => close(true)}>Don’t show again</button><div className="flex gap-2"><Button type="button" variant="ghost" onClick={() => close(false)}>Skip</Button><Button type="button" onClick={next}>{index === steps.length - 1 ? "Done" : "Next"}</Button></div></div></div></div>
}
