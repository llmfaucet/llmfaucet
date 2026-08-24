'use client';
import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { MarketingShell } from '@/components/marketing-shell';
import { api } from '@/lib/api-client';
import type { StatusResponse } from '@/lib/api-types';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/data-states';

export default function StatusPage() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [error, setError] = useState(false);
  const load = () => { setError(false); void api.status().then(setData).catch(() => setError(true)); };
  useEffect(() => { load(); }, []);
  const label = error ? 'Unavailable' : data?.status ?? 'Checking';
  return <MarketingShell><section className="mx-auto max-w-5xl px-5 py-20 lg:px-8"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="font-mono text-xs uppercase tracking-widest text-emerald-600">Live service status</p><h1 className="mt-4 text-5xl font-semibold tracking-tight">{label}</h1><p className="mt-4 text-muted-foreground">Provider health is checked regularly. Anonymous capacity can vary.</p></div><Button variant="outline" onClick={load}><RefreshCw className="mr-2 size-4" />Refresh</Button></div>{error ? <div className="mt-10"><ErrorState message="The status endpoint is unavailable. Try again shortly." /></div> : !data ? <div className="mt-10"><LoadingState label="Checking upstream health" /></div> : <div className="mt-10 overflow-hidden rounded-xl border border-border"><div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-muted/40 text-muted-foreground"><tr><th scope="col" className="p-4">Provider</th><th scope="col" className="p-4">Models</th><th scope="col" className="p-4">Status</th><th scope="col" className="p-4">Latency</th></tr></thead><tbody>{(data.providers ?? []).map(row => <tr className="border-t border-border" key={row.provider}><td className="p-4 font-medium">{row.provider}</td><td className="p-4">{row.models ?? 'Not reported'}</td><td className="p-4">{row.status ?? 'Not reported'}</td><td className="p-4">{row.latencyMs ? `${row.latencyMs} ms` : 'Not reported'}</td></tr>)}</tbody></table></div>{!data.providers?.length && <p className="p-8 text-center text-sm text-muted-foreground">No provider health data is available yet.</p>}</div>}<p className="mt-5 text-xs text-muted-foreground">Last checked: {data?.checkedAt ?? 'not available'}</p></section></MarketingShell>;
}
