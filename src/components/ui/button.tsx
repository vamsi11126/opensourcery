import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'danger';
}

export function Button({
  className,
  variant = 'default',
  ...props
}: ButtonProps): React.JSX.Element {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'default' &&
          'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 hover:scale-[1.02] hover:shadow-indigo-600/50 active:scale-[0.98]',
        variant === 'outline' &&
          'border border-slate-800 bg-slate-900/80 text-slate-200 backdrop-blur-md hover:border-indigo-500/50 hover:bg-slate-800 hover:text-white shadow-sm',
        variant === 'ghost' &&
          'text-slate-300 hover:bg-slate-900/80 hover:text-white',
        variant === 'danger' &&
          'bg-rose-600 text-white shadow-lg shadow-rose-600/20 hover:bg-rose-700 active:scale-[0.98]',
        className
      )}
      {...props}
    />
  );
}
