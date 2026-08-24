'use client';
import { useEffect, useState } from 'react';
import { Check, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { AccountResponse } from '@/lib/api-types';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/data-states';

export default function BillingPage() {
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { api.account().then(setAccount).catch((e: Error) => setError(e.message)); }, []);
  function sync() { window.location.assign(`${api.authUrl}?returnTo=${encodeURIComponent('/dashboard/billing')}`); }
  if (error && !account) return <ErrorState message={error} />;
  if (!account) return <LoadingState label="Loading plan" />;
  return <div><h1 className="text-3xl font-semibold">Billing & sponsors</h1><p className="mt-3 text-muted-foreground">GitHub Sponsors support the shared service. There is no token purchase or reserved capacity.</p>
    <div className="mt-8 rounded-xl border border-border bg-card p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-muted-foreground">Current plan</p><p className="mt-2 text-2xl font-semibold capitalize">{account.entitlement.plan}</p></div><Button variant="outline" onClick={sync}><RefreshCw className="mr-2 size-4" />Sync GitHub Sponsorship</Button></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-lg bg-muted/40 p-4"><p className="text-sm text-muted-foreground">Daily requests</p><p className="mt-2 text-xl font-semibold">{account.entitlement.requestsPerDay}</p></div><div className="rounded-lg bg-muted/40 p-4"><p className="text-sm text-muted-foreground">Queue priority</p><p className="mt-2 text-xl font-semibold">{account.entitlement.queuePriority}</p></div></div>
    </div>
    <div className="mt-4 grid gap-4 md:grid-cols-3">{[['Registered', '$0', '50', 'Standard'], ['Supporter', '$3/month', '200', 'Priority'], ['Pro', '$5/month', '500', 'High']].map(([name, price, requests, priority]) => <div className="rounded-xl border border-border bg-card p-5" key={name}><p className="font-semibold">{name}</p><p className="mt-3 text-2xl font-semibold">{price}</p><div className="mt-5 space-y-2 text-sm text-muted-foreground"><p className="flex gap-2"><Check className="size-4 text-emerald-500" />{requests} requests/day</p><p className="flex gap-2"><Check className="size-4 text-emerald-500" />{priority} access</p></div></div>)}</div>
    <p className="mt-6 text-xs leading-5 text-muted-foreground">Sponsor plans provide fair-use request limits and priority access. They do not guarantee a specific model, token amount, availability, latency, output quality, or production SLA.</p><a href="https://github.com/sponsors/justinedevs" className="mt-6 inline-flex text-sm font-medium text-emerald-600 hover:underline">Support on GitHub Sponsors →</a>
  </div>;
}
