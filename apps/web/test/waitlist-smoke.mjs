import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const required = ['app/waitlist/page.tsx', 'app/dashboard/tester/page.tsx', 'app/admin/waitlist/page.tsx', 'app/admin/waitlist/detail/page.tsx', 'components/waitlist-form.tsx', 'components/ui/expandable-screen.tsx', 'lib/waitlist-types.ts'];
for (const file of required) assert.equal(existsSync(file), true, `${file} is missing`);
const form = readFileSync('components/waitlist-form.tsx', 'utf8');
const screen = readFileSync('components/ui/expandable-screen.tsx', 'utf8');
const admin = readFileSync('app/admin/waitlist/page.tsx', 'utf8');
assert.match(screen, /llmfaucet-waitlist|layoutId/);
assert.match(form, /company_website/);
assert.match(form, /Submitting application/);
assert.doesNotMatch(admin, /\bkey:\s*raw/);
console.log('waitlist UI smoke checks passed');
