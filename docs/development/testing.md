# Testing

Worker contract tests run from `apps/worker/test`; web smoke tests run from
`apps/web/test`. The root scripts delegate to those packages so the same checks
work before and after a future pnpm migration.
