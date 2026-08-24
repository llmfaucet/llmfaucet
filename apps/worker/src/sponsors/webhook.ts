import type { Env } from '../types';
import { constantTimeEqual, hmac } from '../auth/crypto';
import { saveEntitlement } from '../state/users';

export async function sponsorWebhook(request: Request, env: Env): Promise<Response> {
  if (!env.DB || !env.GITHUB_SPONSORS_WEBHOOK_SECRET) return Response.json({ error: 'Sponsor webhook is not configured.' }, { status: 503 });
  const body = await request.text(); const supplied = request.headers.get('x-hub-signature-256') ?? ''; const expected = `sha256=${await hmac(env.GITHUB_SPONSORS_WEBHOOK_SECRET, body)}`;
  if (!(await constantTimeEqual(supplied, expected))) return Response.json({ error: 'Invalid webhook signature.' }, { status: 401 });
  const delivery = request.headers.get('x-github-delivery'); if (!delivery) return Response.json({ error: 'Missing delivery id.' }, { status: 400 });
  const event = request.headers.get('x-github-event') ?? 'unknown'; let payload: { action?: string; sender?: { id?: number; login?: string }; sponsorable?: { login?: string }; sponsorship?: { sponsorable?: { login?: string }; tier?: { id?: string; name?: string }; sponsor?: { id?: number; login?: string } } };
  try { payload = JSON.parse(body); } catch { return Response.json({ error: 'Invalid JSON payload.' }, { status: 400 }); }
  const action = payload.action ?? 'unknown';
  const existing = await env.DB.prepare('SELECT delivery_id, processed_at FROM webhook_events WHERE delivery_id = ?').bind(delivery).first<{ delivery_id: string; processed_at: string | null }>();
  if (existing && (!('processed_at' in existing) || existing.processed_at)) return Response.json({ ok: true, duplicate: true });
  const sponsor = payload.sponsorship?.sponsor; const target = payload.sponsorship?.sponsorable?.login ?? payload.sponsorable?.login;
  await env.DB.prepare('INSERT OR IGNORE INTO webhook_events (delivery_id, event_type, action, payload_json, github_id) VALUES (?, ?, ?, ?, ?)').bind(delivery, event, action, JSON.stringify({ target, tierId: payload.sponsorship?.tier?.id ?? null }), sponsor?.id ? String(sponsor.id) : null).run();
  if (target !== (env.GITHUB_SPONSORABLE_LOGIN ?? env.GITHUB_SPONSOR_LOGIN ?? 'justinedevs') || !sponsor?.id || !sponsor.login) { await env.DB.prepare('UPDATE webhook_events SET processed_at = CURRENT_TIMESTAMP WHERE delivery_id = ?').bind(delivery).run(); return Response.json({ ok: true, ignored: true }); }
  const active = !['cancelled', 'expired'].includes(action); const tierName = payload.sponsorship?.tier?.name ?? 'registered'; const tierId = payload.sponsorship?.tier?.id ?? 'registered';
  await saveEntitlement(env, { githubId: String(sponsor.id), login: sponsor.login, tierId, tierName, active });
  const user = await env.DB.prepare('SELECT id FROM users WHERE github_id = ?').bind(String(sponsor.id)).first<{ id: string }>();
  if (user) {
    const hashes = await env.BUDGETS.get<string[]>(`user:key-hashes:${user.id}`, 'json') ?? [];
    await Promise.all(hashes.map((hash) => env.BUDGETS.delete(`auth:key:${hash}`)));
  }
  await env.DB.prepare('UPDATE webhook_events SET processed_at = CURRENT_TIMESTAMP WHERE delivery_id = ?').bind(delivery).run();
  return Response.json({ ok: true });
}
