import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import { CodeBlock } from './code-block';

function textContent(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return textContent(node.props.children);
  return '';
}

function MdxCodeBlock({ children }: { children?: ReactNode }) {
  const element = isValidElement<{ children?: ReactNode; className?: string }>(children)
    ? children
    : null;
  const code = textContent(element?.props.children ?? children).replace(/\n$/, '');
  const language = element?.props.className?.match(/language-([\w-]+)/)?.[1] ?? 'text';
  return <CodeBlock code={code} language={language} />;
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return { ...defaultMdxComponents, pre: MdxCodeBlock, ...components };
}

export const useMDXComponents = getMDXComponents;
