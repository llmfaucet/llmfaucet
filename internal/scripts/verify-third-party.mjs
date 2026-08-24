#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
let result = '';
try {
  result = execFileSync(
    'grep',
    ['-R', 'internal/third-party', 'apps', 'packages', '--include=*.ts', '--include=*.tsx'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  );
} catch (error) {
  if (error?.status !== 1) throw error;
}
if (result.trim()) {
  console.error(result);
  process.exit(1);
}
console.log('Production import boundary passed.');
