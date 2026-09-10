import { LlmFaucetError } from '../errors';
export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
}
function decode(value: string) {
  const normalized = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');
  return JSON.parse(
    typeof atob === 'function' ? atob(normalized) : Buffer.from(normalized, 'base64').toString('utf8'),
  ) as Record<string, unknown>;
}
export function parseJwtToken(token: string) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new LlmFaucetError({ message: 'Invalid JWT format' });
  const payload = decode(parts[1]);
  return { payload, expiresAt: typeof payload.exp === 'number' ? payload.exp * 1000 : 0 };
}
export function isTokenExpired(token: string, bufferMs = 60_000) {
  try {
    const { expiresAt } = parseJwtToken(token);
    return expiresAt > 0 && Date.now() + bufferMs >= expiresAt;
  } catch {
    return true;
  }
}
