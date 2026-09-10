import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.llmfaucet.dev';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: { title: 'llmfaucet' },
    links: [
      { text: 'API', url: apiUrl },
      { text: 'Preview', url: 'https://dev.llmfaucet.pages.dev' },
      { text: 'GitHub', url: 'https://github.com/llmfaucet/llmfaucet' },
    ],
  };
}
