import type { Env } from '../types';

export interface SponsorStatus { active: boolean; githubId: string; login: string; tierId: string; tierName: string; }
const query = `query SponsorStatus { viewer { login databaseId sponsorshipForViewerAsSponsor(activeOnly: true) { isActive tier { id name } sponsorable { ... on Organization { login } ... on User { login } } } } }`;
export async function sponsorStatus(token: string, env: Env, fetcher: typeof fetch = fetch): Promise<SponsorStatus | null> {
  const response = await fetcher('https://api.github.com/graphql', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', accept: 'application/vnd.github+json', 'user-agent': 'llmfaucet' }, body: JSON.stringify({ query }) });
  if (!response.ok) throw new Error(`GitHub GraphQL returned ${response.status}`);
  const body = await response.json() as { errors?: unknown[]; data?: { viewer?: { login?: string; databaseId?: number; sponsorshipForViewerAsSponsor?: { isActive?: boolean; tier?: { id?: string; name?: string }; sponsorable?: { login?: string } } } } };
  if (body.errors?.length || !body.data?.viewer) throw new Error('GitHub Sponsors response was invalid');
  const item = body.data?.viewer?.sponsorshipForViewerAsSponsor;
  const viewer = body.data?.viewer;
  if (!viewer?.login || !viewer.databaseId || !item?.isActive || item.sponsorable?.login !== (env.GITHUB_SPONSOR_LOGIN ?? 'llmfaucet')) return null;
  return { active: true, githubId: String(viewer.databaseId), login: viewer.login, tierId: item.tier?.id ?? 'registered', tierName: item.tier?.name ?? 'Supporter' };
}
