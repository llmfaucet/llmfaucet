# Oracle probe host

The ARM VPS runs only `apps/probe`; it does not serve the public API or store
user data. Follow the bootstrap and systemd examples, then inject a scoped
Cloudflare API token through the host secret manager.
