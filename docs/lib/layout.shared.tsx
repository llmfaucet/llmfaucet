import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: { title: 'llmfaucet' },
    links: [
      { text: 'API', url: 'https://llmfaucet.pages.dev' },
      { text: 'GitHub', url: 'https://github.com/llmfaucet/llmfaucet' },
    ],
  };
}
