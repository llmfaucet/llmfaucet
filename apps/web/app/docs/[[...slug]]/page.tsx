import { notFound } from 'next/navigation';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import { getMDXComponents } from '@/components/mdx';
import { source } from '@/lib/source';

export const dynamicParams = false;

export function generateStaticParams() {
  return source.generateParams();
}

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const page = source.getPage((await params).slug);
  if (!page) notFound();

  const MDX = page.data.body;
  return (
    <DocsPage toc={page.data.toc} full={page.data.full} tableOfContent={{ style: 'clerk' }}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
          <DocsBody><MDX components={getMDXComponents()} /></DocsBody>
    </DocsPage>
  );
}
