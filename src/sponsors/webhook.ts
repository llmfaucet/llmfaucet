import type { Env } from '../types';
import { constantTimeEqual, hmac } from '../auth/crypto';
import { entitlementFor } from './entitlements';

export async function sponsorWebhook(request: Request, env: Env): Promise<Response> {
  if (!env.DB || !env.GITHUB_SPONSORS_WEBHOOK_SECRET) return Response.json({ error: 'Sponsor webhook is not configured.' }, { status: 503 });
  const body = await request.text(); const supplied = request.headers.get('x-hub-signature-256') ?? ''; const expected = `sha256=${await hmac(env.GITHUB_SPONSORS_WEBHOOK_SECRET, body)}`;
  if (!(await constantTimeEqual(supplied, expected))) return Response.json({ error: 'Invalid webhook signature.' }, { status: 401 });
  const delivery = request.headers.get('x-github-delivery'); if (!delivery) return Response.json({ error: 'Missing delivery id.' }, { status: 400 });
  const event = request.headers.get('x-github-event') ?? 'unknown'; let payload: { action?: string; sender?: { id?: number; login?: string }; sponsorable?: { login?: string }; sponsorship?: { sponsorable?: { login?: string }; tier?: { id?: string; name?: string }; sponsor?: { id?: number; login?: string } } };
  try { payload = JSON.parse(body); } catch { return Response.json({ error: 'Invalid JSON payload.' }, { status: 400 }); }
  const action = payload.action ?? 'unknown';
  const existing = await env.DB.prepare('SELECT delivery_id FROM webhook_events WHERE delivery_id = ?').bind(delivery).first();
  if (existing) return Response.json({ ok: true, duplicate: true });
  const sponsor = payload.sponsorship?.sponsor; const target = payload.sponsorship?.sponsorable?.login ?? payload.sponsorable?.login;
  if (target !== (env.GITHUB_SPONSOR_LOGIN ?? 'llmfaucet') || !sponsor?.id || !sponsor.login) return Response.json({ ok: true, ignored: true });
  const active = !['cancelled', 'expired'].includes(action); const tierName = payload.sponsorship?.tier?.name ?? 'registered'; const tier = entitlementFor(tierName.toLowerCase());
  await env.DB.prepare('INSERT INTO sponsor_entitlements (github_id, github_login, tier_id, tier_name, status, requests_per_day, queue_priority, sponsorship_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(github_id) DO UPDATE SET status = excluded.status, tier_name = excluded.tier_name, requests_per_day = excluded.requests_per_day, queue_priority = excluded.queue_priority, sponsorship_updated_at = excluded.sponsorship_updated_at, updated_at = CURRENT_TIMESTAMP').bind(String(sponsor.id), sponsor.login, payload.sponsorship?.tier?.id ?? 'registered', tierName, active ? 'active' : 'registered', active ? tier.requestsPerDay : 50, active ? tier.queuePriority : 10, new Date().toISOString()).run();
  await env.DB.prepare('INSERT INTO webhook_events (delivery_id, event_type, action, payload_json, processed_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)').bind(delivery, event, action, body).run();
  return Response.json({ ok: true });
}
