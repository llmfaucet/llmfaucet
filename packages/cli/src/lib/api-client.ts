export async function checkAPIConnectivity(baseURL = 'https://api.llmfaucet.dev/v1', fetcher = globalThis.fetch) {
  const endpoint = `${baseURL.replace(/\/v1\/?$/, '')}/status`;
  const response = await fetcher(endpoint, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`status ${response.status}`);
  const body = await response.json().catch(() => ({}));
  return { endpoint, status: body.status ?? 'reachable' };
}
