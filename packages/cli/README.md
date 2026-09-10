# @llmfaucet/cli

Setup and diagnostics for llmfaucet coding-agent integrations.

```bash
npx @llmfaucet/cli@latest setup
npx @llmfaucet/cli@latest doctor
npx @llmfaucet/cli@latest status
npx @llmfaucet/cli@latest config show
```

Supported agents: Aider, Claude Code, Cline, Codex CLI, Continue, and Roo Code. Use `setup --dry-run` to inspect output without writing files. API keys are read from `LLMFAUCET_API_KEY` and are never printed by normal output.
