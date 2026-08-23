import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

export default withMDX({
  turbopack: { root: new URL('.', import.meta.url).pathname },
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
});
