import Image from 'next/image';
import Link from 'next/link';

export function Brand({ light = false }: { light?: boolean }) {
  return <Link href="/" className="flex items-center gap-2 font-mono text-sm font-semibold tracking-tight" aria-label="llmfaucet home">
    <Image src="/assets/Logo.png" alt="" width={28} height={28} className="size-7 rounded-md" priority />
    <span className={light ? 'text-white' : ''}>llmfaucet</span>
  </Link>;
}

