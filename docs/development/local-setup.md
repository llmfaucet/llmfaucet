# Local setup

The repository currently preserves npm as its executable package manager. Run
`npm install`, then `npm run typecheck`, `npm test`, and `npm run build`.

Worker-local bindings belong in `apps/worker/.dev.vars`, based on the example.
Never commit populated environment files.

To exercise the dynamic registry locally, apply the Worker migrations to the
local D1 database, including `0009_providers.sql`, then use the authenticated
admin provider routes. Health probes and catalog refreshes run in the Worker
scheduled handler in deployed environments; no separate probe process is
required.
