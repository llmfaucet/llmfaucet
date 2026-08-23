# Contributing to llmfaucet

Thanks for helping improve the project.

## Before you start

For significant behavior or architecture changes, open an issue first. Keep
pull requests focused, small, and compatible with the project's zero-cost,
anonymous-access goals.

Do not add provider scraping, account rotation, leaked credentials, or
unofficial access methods.

## Development

```sh
npm ci
npm test
npm run build
```

Add or update a focused contract test for non-trivial behavior. Keep secrets out
of source, logs, fixtures, and pull requests. Do not deploy from a pull request.

## Pull requests

Describe the user-facing behavior, affected routes/providers, tests run, and
any known upstream or Cloudflare limitations. Update documentation when API
behavior, configuration, or agent setup changes.

Maintainers may request changes when a patch weakens validation, rate limits,
security, accessibility, or honest provider signaling.

## Commit and review expectations

Use clear imperative commit messages. A pull request should pass the build,
tests, and dependency audit before review. Keep unrelated formatting and
generated files out of the diff.
