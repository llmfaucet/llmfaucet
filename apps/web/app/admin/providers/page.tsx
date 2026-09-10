'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { api, type AdminProvider } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ErrorState, LoadingState } from '@/components/data-states';

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<AdminProvider[] | null>(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const load = () => api.adminProviders().then(({ providers: rows }) => setProviders(rows)).catch((e: Error) => setError(e.message));
  useEffect(() => { void load(); }, []);
  async function mutate(action: () => Promise<unknown>) { try { setError(''); await action(); await load(); } catch (e) { setError((e as Error).message); } }
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    await mutate(() => api.createProvider({ name: values.name, displayName: values.displayName, baseURL: values.baseURL, adapterType: values.adapterType }));
    event.currentTarget.reset();
    setCreating(false);
  }
  if (error && !providers) return <ErrorState message={error} />;
  if (!providers) return <LoadingState label="Loading providers" />;
  return <div>
    <p className="font-mono text-xs uppercase tracking-widest text-emerald-600">Administration</p>
    <h1 className="mt-3 text-3xl font-semibold">Provider registry</h1>
    <p className="mt-3 max-w-2xl text-sm text-muted-foreground">Enable, disable, inspect, and refresh the providers used by dynamic routing.</p>
    {error && <div className="mt-4"><ErrorState message={error} /></div>}
    <div className="mt-6 rounded-xl border border-border bg-card p-4">
      <Button type="button" variant="outline" onClick={() => setCreating((value) => !value)}>{creating ? 'Cancel' : 'Add provider'}</Button>
      {creating && <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => void create(event)}>
        <Input name="name" pattern="[a-z0-9][a-z0-9_-]{1,63}" placeholder="provider-name" aria-label="Provider name" required />
        <Input name="displayName" placeholder="Display name" aria-label="Display name" required />
        <Input className="sm:col-span-2" name="baseURL" type="url" placeholder="https://provider.example/v1" aria-label="Base URL" required />
        <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="adapterType" aria-label="Adapter type" defaultValue="openai-compatible">
          <option value="openai-compatible">OpenAI-compatible</option>
          <option value="pollinations">Pollinations</option>
          <option value="llm7">LLM7</option>
          <option value="ovh">OVHcloud AI</option>
          <option value="opencode-zen">OpenCode Zen</option>
        </select>
        <Button type="submit">Register provider</Button>
      </form>}
    </div>
    <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-muted/40 text-muted-foreground"><tr>{['Provider', 'Endpoint', 'Health', 'Priority', 'Models', 'Actions'].map((label) => <th scope="col" className="p-4" key={label}>{label}</th>)}</tr></thead>
        <tbody>{providers.map((provider) => <tr className="border-t border-border" key={provider.id}>
          <td className="p-4"><p className="font-medium">{provider.display_name}</p><p className="text-xs text-muted-foreground">{provider.name}</p></td>
          <td className="max-w-xs truncate p-4 text-muted-foreground">{provider.base_url}</td>
          <td className="p-4"><span className={provider.health?.status === 'healthy' ? 'text-emerald-600' : provider.health?.status === 'down' ? 'text-red-600' : 'text-amber-600'}>{provider.health?.status ?? 'unknown'}</span>{provider.health?.latencyMs !== undefined && <span className="ml-2 text-xs text-muted-foreground">{provider.health.latencyMs}ms</span>}</td>
          <td className="p-4">{provider.priority} × {provider.weight}</td><td className="p-4">{provider.model_count}</td>
          <td className="flex flex-wrap gap-2 p-4"><Button size="sm" variant="outline" onClick={() => void mutate(() => api.updateProvider(provider.id, { isEnabled: !provider.is_enabled }))}>{provider.is_enabled ? 'Disable' : 'Enable'}</Button><Button size="sm" variant="outline" onClick={() => void mutate(() => api.checkProviderHealth(provider.id))}>Check health</Button><Button size="sm" variant="outline" onClick={() => void mutate(() => api.refreshProvider(provider.id))}>Refresh models</Button><Button size="sm" variant="destructive" onClick={() => { if (confirm(`Delete ${provider.display_name}?`)) void mutate(() => api.deleteProvider(provider.id)); }}>Delete</Button></td>
        </tr>)}</tbody>
      </table>
      {!providers.length && <p className="p-8 text-center text-sm text-muted-foreground">No providers registered.</p>}
    </div>
  </div>;
}
