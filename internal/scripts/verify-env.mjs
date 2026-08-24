#!/usr/bin/env node
const required = ['ENVIRONMENT', 'IP_HASH_SECRET', 'SESSION_HMAC_SECRET'];
const missing = required.filter((name) => !process.env[name]);
console.log(
  JSON.stringify({ environment: process.env.ENVIRONMENT ?? 'unset', requiredSecretsConfigured: missing.length === 0 }),
);
if (missing.length) console.log(`Missing local variables: ${missing.join(', ')}`);
