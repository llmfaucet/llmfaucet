import Link from "next/link"
import { SiGithub } from "react-icons/si"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field"
import { authUrl } from "@/lib/api-client"

export function LoginForm({ error }: { error?: string }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to manage your llmfaucet API keys, usage, and sponsor access.</p>
      </div>
      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p> : null}
      <FieldGroup>
        <Field><Button asChild className="w-full" size="lg"><a href={authUrl}><SiGithub className="mr-2 size-4" aria-hidden="true" />Continue with GitHub</a></Button></Field>
        <FieldDescription className="text-center leading-6">GitHub sign-in creates your account and verifies sponsorship. OAuth tokens are not retained.</FieldDescription>
      </FieldGroup>
      <p className="text-center text-sm text-muted-foreground">No account yet? <Link className="font-medium text-foreground underline underline-offset-4" href="/signup">Create your free account</Link></p>
      <p className="text-center text-xs text-muted-foreground"><Link className="underline underline-offset-4" href="/privacy">Read the privacy policy</Link></p>
    </div>
  )
}
