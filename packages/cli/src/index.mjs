#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const home = homedir();
const args = process.argv.slice(2);
if (args[0] !== 'setup') {
  console.log('Usage: npx llmfaucet setup [--write]');
  process.exit(args.length ? 1 : 0);
}
const write = args.includes('--write');
const block =
  '[model_providers.llmfaucet]\nbase_url = "https://api.llmfaucet.dev/v1"\nenv_key = "LLMFAUCET_API_KEY"\nwire_api = "responses"\n';
const codex = join(home, '.codex', 'config.toml');
const cont = join(home, '.continue', 'config.yaml');
const found = [
  existsSync(join(home, '.codex')) && 'Codex CLI',
  existsSync(join(home, '.continue')) && 'Continue',
].filter(Boolean);
console.log(`Detected: ${found.length ? found.join(', ') : 'no local agent config directories'}`);
console.log('Endpoint: https://api.llmfaucet.dev/v1');
if (!write) {
  console.log('Dry run. Re-run with --write to update detected configs.');
  process.exit(0);
}
if (existsSync(codex)) {
  const current = readFileSync(codex, 'utf8');
  if (!current.includes('[model_providers.llmfaucet]')) writeFileSync(codex, `${current.trimEnd()}\n\n${block}`);
  console.log(`Checked ${codex}`);
}
if (existsSync(cont)) {
  const current = readFileSync(cont, 'utf8');
  if (!current.includes('api.llmfaucet.dev'))
    writeFileSync(
      cont,
      `${current.trimEnd()}\n\nmodels:\n  - name: llmfaucet-auto\n    provider: openai\n    model: auto\n    apiBase: https://api.llmfaucet.dev/v1\n    apiKey: free\n`,
    );
  console.log(`Checked ${cont}`);
}
console.log('Set ANTHROPIC_BASE_URL and ANTHROPIC_AUTH_TOKEN manually for Claude Code.');
