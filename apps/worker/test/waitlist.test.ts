import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync('migrations/0004_waitlist.sql', 'utf8');
const handler = readFileSync('src/waitlist.ts', 'utf8');
const worker = readFileSync('src/index.ts', 'utf8');
assert.match(migration, /CREATE TABLE IF NOT EXISTS waitlist_applications/);
assert.match(migration, /UNIQUE INDEX IF NOT EXISTS idx_waitlist_github_login_unique/);
assert.match(handler, /company_website/);
assert.match(handler, /Too many waitlist updates/);
assert.match(handler, /early_tester/);
assert.match(handler, /preview_key_id/);
assert.match(handler, /Use the dedicated revoke action to remove approved preview access/);
assert.match(worker, /\/api\/waitlist/);
assert.match(worker, /\/api\/admin\/waitlist/);
console.log('waitlist backend contract tests passed');
