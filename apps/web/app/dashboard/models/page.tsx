'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api-client';
import type { ModelRecord } from '@/lib/api-types';
import { Input } from '@/components/ui/input';
import { LoadingState, EmptyState, ErrorState } from '@/components/data-states';

export default function ModelsPage() {
  const [models, setModels] = useState<ModelRecord[] | null>(null); const [query, setQuery] = useState(''); const [error, setError] = useState('');
  useEffect(() => { api.models().then(x => setModels(x.data ?? [])).catch((e: Error) => setError(e.message)); }, []);
  const filtered = useMemo(() => models?.filter(m => (m.id ?? '').toLowerCase().includes(query.toLowerCase()) || m.provider?.toLowerCase().includes(query.toLowerCase())), [models, query]);
  return <div><h1 className="text-3xl font-semibold">Models</h1><p className="mt-3 max-w-2xl text-muted-foreground">Use <code>auto</code> for healthy compatible routing, <code>auto:coding</code> for code-focused routes, <code>auto:fast</code> for lower latency, and <code>auto:smart</code> for higher-ranked available models.</p>{error ? <div className="mt-8"><ErrorState message={error} /></div> : !models ? <div className="mt-8"><LoadingState label="Loading model catalog" /></div> : <><div className="mt-8 max-w-md"><label className="sr-only" htmlFor="model-search">Search models</label><Input id="model-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search model or provider" /></div><div className="mt-4 overflow-hidden rounded-xl border border-border bg-card"><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-muted/40 text-muted-foreground"><tr><th scope="col" className="p-4">Model</th><th scope="col" className="p-4">Provider</th><th scope="col" className="p-4">Capabilities</th><th scope="col" className="p-4">Context</th><th scope="col" className="p-4">Status</th></tr></thead><tbody>{filtered?.map(m => <tr className="border-t border-border" key={m.id}><td className="p-4 font-mono text-xs">{m.id}</td><td className="p-4">{m.provider ?? m.owned_by ?? '—'}</td><td className="p-4 text-xs">{m.capabilities?.join(' · ') ?? m.supported_parameters?.join(' · ') ?? '—'}</td><td className="p-4">{m.context_window?.toLocaleString() ?? 'Not reported'}</td><td className="p-4">{m.status ?? 'Not reported'}</td></tr>)}</tbody></table></div>{!filtered?.length && <EmptyState title="No matching models" body="The live catalog has no models matching this filter." />}</div></>}</div>;
}
