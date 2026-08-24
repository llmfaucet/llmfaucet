# Local setup

The repository currently preserves npm as its executable package manager. Run
`npm install`, then `npm run typecheck`, `npm test`, and `npm run build`.

Worker-local bindings belong in `apps/worker/.dev.vars`, based on the example.
Never commit populated environment files.
