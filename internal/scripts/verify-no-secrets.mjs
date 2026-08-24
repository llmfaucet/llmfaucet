#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = [
  '.github',
  'apps',
  'packages',
  'infra',
  'docs',
  'internal',
  '.env.example',
  '.dev.vars.example',
  'package.json',
  'package-lock.json',
  'pnpm-workspace.yaml',
  'tsconfig.base.json',
  'tsconfig.json',
];
const ignored = /(?:node_modules|\.next|out|dist|coverage|\.git|internal\/third-party)/;
const secret =
  /(?:BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|Bearer\s+[A-Za-z0-9._-]{24,})/;
const files = [];
function walk(path) {
  if (ignored.test(path)) return;
  const stat = statSync(path);
  if (stat.isDirectory()) for (const entry of readdirSync(path)) walk(join(path, entry));
  else if (/\.(?:ts|tsx|mjs|cjs|json|toml|yml|yaml|md|sql|env)$/.test(path)) files.push(path);
}
for (const root of roots) walk(root);
const hits = files.flatMap((file) => (secret.test(readFileSync(file, 'utf8')) ? [file] : []));
if (hits.length) {
  console.error(`Possible secret material in: ${hits.join(', ')}`);
  process.exit(1);
}
console.log(`Secret scan passed (${files.length} source/config files checked).`);
