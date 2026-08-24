"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Brand } from "@/components/brand"
import { AuthSplitLayout } from "@/components/auth/auth-split-layout"
import { LoginForm } from "@/components/login-form"

function LoginPageContent() {
  const params = useSearchParams()
  return <AuthSplitLayout><div className="flex items-center justify-between"><Brand /><a className="text-sm text-muted-foreground hover:text-foreground" href="/">Back to site</a></div><div className="mx-auto flex w-full max-w-sm flex-1 items-center"><div className="w-full"><LoginForm error={params.get("error") ? "Sign-in could not be completed. Please try GitHub again." : undefined} /></div></div></AuthSplitLayout>
}

export default function LoginPage() {
  return <Suspense fallback={<AuthSplitLayout><div className="mx-auto flex w-full max-w-sm flex-1 items-center"><p className="text-sm text-muted-foreground">Loading sign-in…</p></div></AuthSplitLayout>}><LoginPageContent /></Suspense>
}
