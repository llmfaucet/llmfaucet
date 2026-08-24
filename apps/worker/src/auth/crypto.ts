const hex = (value: Uint8Array): string => [...value].map((byte) => byte.toString(16).padStart(2, '0')).join('');
const encoded = (value: Uint8Array): string => btoa(String.fromCharCode(...value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
export function randomString(size = 32): string { return encoded(crypto.getRandomValues(new Uint8Array(size))); }
export async function hmac(secret: string, value: string): Promise<string> { const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return hex(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)))); }
export async function constantTimeEqual(left: string, right: string): Promise<boolean> { const a = new TextEncoder().encode(left); const b = new TextEncoder().encode(right); if (a.length !== b.length) return false; let result = 0; for (let i = 0; i < a.length; i++) result |= a[i] ^ b[i]; return result === 0; }
