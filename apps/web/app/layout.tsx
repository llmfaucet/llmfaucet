import type { ReactNode } from 'react';
import { RootProvider } from 'fumadocs-ui/provider/next';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from '@/components/theme-provider';
import { ReactLenis } from 'lenis/react';

export const metadata = {
  title: 'llmfaucet',
  description: 'One endpoint. Free AI models. No keys, no setup.',
  icons: { icon: '/assets/Logo.png' },
};

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className="flex min-h-screen flex-col font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange><ReactLenis root><RootProvider>{children}</RootProvider></ReactLenis></ThemeProvider>
      </body>
    </html>
  );
}
