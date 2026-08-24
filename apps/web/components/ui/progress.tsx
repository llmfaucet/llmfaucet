import { cn } from '@/lib/utils';

export function Progress({ value = 0, className, 'aria-label': ariaLabel = 'Progress' }: { value?: number; className?: string; 'aria-label'?: string }) {
  return <div role="progressbar" aria-label={ariaLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}><div className="h-full bg-foreground transition-[width]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}
