"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BookOpen, Code2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/code-block"
import { ChoiceGroup, Onboarding, TipsList } from "@/components/ui/onboarding"
import { IntroDisclosure } from "@/components/ui/intro-disclosure"
import { api, apiBase } from "@/lib/api-client"
import type { Preferences } from "@/lib/api-types"
import { ONBOARDING_VERSION } from "@/lib/onboarding"

const workflows = ["Coding agent", "OpenAI SDK / application", "Automation / workflow", "Exploring the API"]
const features = [
  ["One endpoint", "OpenAI-compatible routing for apps and agents.", Code2],
  ["Clear limits", "See request limits, reset times, and service status.", BookOpen],
  ["Your control", "Create and revoke personal API keys anytime.", Download],
] as const

export function FirstRunOnboarding() {
  const [prefs, setPrefs] = useState<Preferences | null>(null)
  const [workflow, setWorkflow] = useState("Coding agent")
  const [error, setError] = useState("")
  const [showDisclosure, setShowDisclosure] = useState(false)
  useEffect(() => { api.preferences().then(({ preferences }) => { setPrefs(preferences); setWorkflow(preferences.primaryWorkflow ?? "Coding agent") }).catch(() => setError("Onboarding could not load. Please retry.")) }, [])
  if (error) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-5"><div className="rounded-2xl border bg-card p-6" role="alert">{error}</div></div>
  if (!prefs || (prefs.onboardingCompletedAt || prefs.onboardingDismissedAt) && prefs.onboardingVersion === ONBOARDING_VERSION) return null
  const finish = async (dismiss = false) => { try { const result = dismiss ? await api.dismissOnboarding() : await api.completeOnboarding(); setPrefs(result.preferences); if (!dismiss) setShowDisclosure(true) } catch { setError("Could not save onboarding state. Please retry.") } }
  const base = apiBase || "https://api.llmfaucet.dev"
  const snippets: Record<string, string> = { "Coding agent": `baseURL: "${base}/v1"\nmodel: "auto:coding"`, "OpenAI SDK / application": `baseURL: "${base}/v1"\napiKey: "llmfaucet_…"`, "Automation / workflow": `POST ${base}/v1/chat/completions`, "Exploring the API": `curl ${base}/v1/models` }
  return <><div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="llmfaucet onboarding"><div className="w-full max-w-2xl"><Onboarding totalSteps={4} onComplete={() => void finish()}><Onboarding.StepIndicator totalSteps={4} /><div className="my-8 min-h-[260px]"><Onboarding.Step step={1}><Onboarding.Header title="Welcome to llmfaucet" description="One endpoint for real developer workflows." /><div className="mt-7 grid gap-3">{features.map(([title, description, Icon]) => <div key={title} className="flex gap-3 rounded-xl border p-4"><Icon className="size-5 text-primary" /><div><p className="font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">{description}</p></div></div>)}</div></Onboarding.Step><Onboarding.Step step={2}><Onboarding.Header title="Choose your primary workflow" description="We’ll use this to tailor setup guidance." /><ChoiceGroup name="Primary workflow" value={workflow} onValueChange={(value) => { setWorkflow(value); void api.updatePreferences({ primaryWorkflow: value }) }} className="mt-7 grid gap-2 sm:grid-cols-2">{workflows.map((value) => <ChoiceGroup.Item key={value} value={value} className="rounded-xl border p-4 text-left text-sm">{value}</ChoiceGroup.Item>)}</ChoiceGroup></Onboarding.Step><Onboarding.Step step={3}><Onboarding.Header title="Configure your first client" description="Create an API key before using a private key with a client." /><div className="mt-7"><CodeBlock code={snippets[workflow]} language="setup" /></div></Onboarding.Step><Onboarding.Step step={4}><Onboarding.Header title="You’re ready to build" description="Start with the quickstart, test one real workflow, and check status when capacity changes." /><div className="mt-7 flex flex-wrap gap-3"><Button asChild><Link href="/docs/quickstart">Read quickstart</Link></Button><Button asChild variant="outline"><Link href="/dashboard">Open dashboard</Link></Button></div><div className="mt-7"><TipsList title="Next steps"><TipsList.Item number={1}>Create a personal API key.</TipsList.Item><TipsList.Item number={2}>Configure your preferred coding tool.</TipsList.Item><TipsList.Item number={3}>Report reproducible compatibility issues.</TipsList.Item></TipsList></div></Onboarding.Step></div><Onboarding.Navigation completeLabel="Finish" /></Onboarding><button type="button" className="mt-3 block w-full text-center text-xs text-muted-foreground underline" onClick={() => void finish(true)}>Don’t show again</button></div></div>{showDisclosure && <IntroDisclosure featureId="routing-headers-v1" steps={[{ title: "Routing headers", short_description: "See which source handled each request.", full_description: "Inspect X-Routed-Via and standard rate-limit headers in your client response." }, { title: "Usage limits", short_description: "Check daily request allowance and UTC reset time.", full_description: "Use Retry-After and the dashboard usage view when shared capacity is busy." }]} onComplete={() => setShowDisclosure(false)} onSkip={() => setShowDisclosure(false)} />}</>
}
