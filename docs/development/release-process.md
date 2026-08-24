# Release process

1. Validate locally and deploy the `dev` branch to preview.
2. Apply preview migrations and smoke-test auth, waitlist, status, and gateway.
3. Review the diff and provider policy.
4. Merge to `main` only after preview evidence is clean.
5. Production deployment remains an explicit operator action.
