# Oracle probe host

The ARM VPS runs only `apps/probe`; it does not serve the public API or store
user data. Follow the bootstrap and systemd examples, then install the probe
environment as a mode-0600 file:

```bash
scp .env infra/oracle/scripts/load-env.sh ubuntu@oracle-host:/tmp/
ssh ubuntu@oracle-host \
  'sudo bash /tmp/load-env.sh /tmp/.env'
```

The probe needs `PROBE_INTERVAL_MS`, `CF_ACCOUNT_ID`, `CF_API_TOKEN`,
`CF_KV_NAMESPACE_ID`, and `CF_D1_DATABASE_ID` for dynamic registry reads and
health/model writes. `PROVIDER_MODEL_SYNC_INTERVAL_MS` defaults to six hours.
Provider endpoint variables are optional because the checked-in defaults are
used when omitted. Keep the source file off shell history and remove both
temporary copies after loading. The systemd unit reads `/opt/llmfaucet/.env`
through `EnvironmentFile`.

The Cloudflare API token should be scoped to the account and only the resources
the probe uses: D1 database query/write, KV namespace value read/write, and no
Worker deployment or user-management permissions. The probe never receives or
stores provider API key values.
