import Link from "next/link"
import { SiGithub } from "react-icons/si"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field"
import { authUrl } from "@/lib/api-client"

export function SignupForm() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create your free developer account</h1>
        <p className="text-sm text-muted-foreground">Get a personal API key, 50 daily requests, and a simple way to connect your coding tools.</p>
      </div>
      <FieldGroup>
        <Field><Button asChild className="w-full" size="lg"><a href={authUrl}><SiGithub className="mr-2 size-4" aria-hidden="true" />Continue with GitHub</a></Button></Field>
        <FieldDescription className="text-center leading-6">GitHub sign-in uses the existing read-only profile scope. OAuth tokens are not retained.</FieldDescription>
      </FieldGroup>
      <ul className="space-y-2 text-sm text-muted-foreground">{["Personal API key", "50 requests per day", "Usage visibility", "GitHub Sponsors upgrades when you support the project"].map((item) => <li key={item} className="flex gap-2"><span aria-hidden="true">•</span>{item}</li>)}</ul>
      <p className="text-center text-sm text-muted-foreground">Already have an account? <Link className="font-medium text-foreground underline underline-offset-4" href="/login">Sign in</Link></p>
    </div>
  )
}
