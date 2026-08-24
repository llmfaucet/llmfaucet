import { secureRandomHex, sha256 } from '../lib/crypto';
// Accept the prior 32-character base64url format while users rotate to the current hex format.
export const API_KEY_PATTERN = /^llmfaucet_[A-Za-z0-9_-]{32,64}$/;
export function createApiKey(): string { return `llmfaucet_${secureRandomHex(32)}`; }
export async function keyRecord(rawKey: string): Promise<{ hash: string; prefix: string }> { return { hash: await sha256(rawKey), prefix: rawKey.slice(0, 16) }; }
