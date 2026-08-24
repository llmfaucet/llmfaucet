"use client"

import { Brand } from "@/components/brand"
import { AuthSplitLayout } from "@/components/auth/auth-split-layout"
import { SignupForm } from "@/components/signup-form"

export default function SignupPage() {
  return <AuthSplitLayout><div className="flex items-center justify-between"><Brand /><a className="text-sm text-muted-foreground hover:text-foreground" href="/">Back to site</a></div><div className="mx-auto flex w-full max-w-sm flex-1 items-center"><div className="w-full"><SignupForm /></div></div></AuthSplitLayout>
}
