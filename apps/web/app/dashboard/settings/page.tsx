"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Settings2 } from "lucide-react"
import { api } from "@/lib/api-client"
import type { AccountResponse, Preferences } from "@/lib/api-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingState, ErrorState } from "@/components/data-states"
import { AnimatedThemeToggler } from "@/components/animated-theme-toggler"
import ToolbarExpandable from "@/components/ui/toolbar-expandable"

const sections = ["account", "preferences", "privacy", "access", "danger"] as const
type Section = (typeof sections)[number]

export default function SettingsPage() {
  const router = useRouter()
  const { setTheme } = useTheme()
  const [account, setAccount] = useState<AccountResponse | null>(null)
  const [prefs, setPrefs] = useState<Preferences | null>(null)
  const [section, setSection] = useState<Section>("account")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("section")
    if (requested && sections.includes(requested as Section)) setSection(requested as Section)
    Promise.all([api.account(), api.preferences()]).then(([nextAccount, result]) => { setAccount(nextAccount); setPrefs(result.preferences) }).catch((reason: Error) => setError(reason.message))
  }, [])

  const select = (value: Section) => { setSection(value); router.replace(`/dashboard/settings?section=${value}`) }
  const save = async (patch: Partial<Preferences>) => { try { const result = await api.updatePreferences(patch); setPrefs(result.preferences); if (patch.theme) setTheme(patch.theme) } catch (reason) { setError((reason as Error).message) } }
  const logout = async () => { try { await api.logout(); router.push("/") } catch (reason) { setError((reason as Error).message) } }
  const replay = async () => { setBusy(true); try { await api.replayOnboarding(); router.push("/dashboard") } catch (reason) { setError((reason as Error).message) } finally { setBusy(false) } }
  const remove = async () => { if (confirm !== "DELETE MY ACCOUNT") return; setBusy(true); try { await api.deleteAccount(); router.push("/") } catch (reason) { setError((reason as Error).message) } finally { setBusy(false) } }

  if (error && !account) return <ErrorState message={error} />
  if (!account || !prefs) return <LoadingState label="Loading account settings" />
  const toolbarSteps = sections.map((value) => ({ id: value, title: value, description: `Configure ${value} settings.`, icon: Settings2, content: null }))
  return <div className="max-w-4xl space-y-5">
    <div className="flex items-end justify-between gap-4"><div><p className="text-sm text-muted-foreground">Developer console</p><h1 className="mt-2 text-3xl font-semibold">Settings</h1></div><AnimatedThemeToggler /></div>
    <ToolbarExpandable badgeText="SETTINGS" steps={toolbarSteps} activeStep={section} onActiveStepChange={(value) => { if (value && sections.includes(value as Section)) select(value as Section) }} />
    <section className="rounded-2xl border border-border bg-card p-6">
      {section === "account" && <><h2 className="text-xl font-semibold">Account</h2><p className="mt-3 text-muted-foreground">@{account.user.githubLogin}</p><Button variant="outline" className="mt-5" onClick={() => void logout()}>Log out</Button></>}
      {section === "preferences" && <><h2 className="text-xl font-semibold">Preferences</h2><label className="mt-5 block text-sm font-medium">Theme<select aria-label="Theme" className="mt-2 block h-10 rounded-md border border-input bg-background px-3" value={prefs.theme} onChange={(event) => void save({ theme: event.target.value as Preferences["theme"] })}><option>system</option><option>light</option><option>dark</option></select></label><label className="mt-5 block text-sm font-medium">Default model selector<select aria-label="Default model selector" className="mt-2 block h-10 rounded-md border border-input bg-background px-3" value={prefs.defaultModelSelector} onChange={(event) => void save({ defaultModelSelector: event.target.value as Preferences["defaultModelSelector"] })}><option>auto</option><option>auto:fast</option><option>auto:smart</option><option>auto:coding</option></select></label><Button variant="outline" className="mt-5" disabled={busy} onClick={() => void replay()}>{busy ? "Preparing…" : "Replay product walkthrough"}</Button></>}
      {section === "privacy" && <><h2 className="text-xl font-semibold">Privacy</h2><p className="mt-3 leading-7 text-muted-foreground">API keys are hashed, GitHub OAuth tokens are not retained, prompts are not retained by default, and anonymous limits use rotating identifiers.</p><a href="/privacy" className="mt-4 inline-block text-emerald-600 underline">Read privacy policy</a></>}
      {section === "access" && <><h2 className="text-xl font-semibold">API access</h2><p className="mt-3 text-muted-foreground">{account.keys.filter((key) => key.status === "active").length} active key(s). Existing raw keys cannot be recovered.</p><Button asChild variant="outline" className="mt-5"><a href="/dashboard/keys">Manage API keys</a></Button></>}
      {section === "danger" && <><h2 className="text-xl font-semibold text-destructive">Danger zone</h2><p className="mt-3 leading-7 text-muted-foreground">This permanently removes your profile, keys, sessions, preferences, sponsorship entitlement, waitlist records, and personal operational records.</p><Input className="mt-5 max-w-sm" value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="DELETE MY ACCOUNT" aria-label="Delete account confirmation" /><Button variant="destructive" className="mt-4" disabled={busy || confirm !== "DELETE MY ACCOUNT"} onClick={() => void remove()}>{busy ? "Deleting…" : "Delete account"}</Button></>}
    </section>
    {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
  </div>
}
