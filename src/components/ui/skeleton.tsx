import * as React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn(
        'skeleton-shimmer animate-pulse rounded-lg border border-slate-800/80 bg-slate-800/60 backdrop-blur-sm',
        className
      )}
      {...props}
    />
  );
}

