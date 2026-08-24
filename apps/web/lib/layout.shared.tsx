import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://<worker-subdomain>.workers.dev';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: { title: 'llmfaucet' },
    links: [
      { text: 'API', url: apiUrl },
      { text: 'GitHub', url: 'https://github.com/llmfaucet/llmfaucet' },
    ],
  };
}
