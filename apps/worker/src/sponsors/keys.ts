const bytes = (size: number): Uint8Array => crypto.getRandomValues(new Uint8Array(size));
const hex = (value: Uint8Array): string => [...value].map((byte) => byte.toString(16).padStart(2, '0')).join('');
export async function hashApiKey(key: string): Promise<string> { const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key)); return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join(''); }
export function keyPrefix(key: string): string { return key.slice(0, 16); }
export function generateApiKey(): string { return `llmfaucet_${hex(bytes(32))}`; }
