'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';

export function TrendingSearches(): React.JSX.Element {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/search/trending')
      .then((response) => response.json())
      .then((payload: { data?: Array<{ query: string }> }) =>
        setItems((payload.data ?? []).map((item) => item.query))
      )
      .catch(() => undefined);
  }, []);

  if (!items.length) return <></>;

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
        Trending:
      </span>
      {items.map((query) => (
        <Link
          key={query}
          href={`/projects?q=${encodeURIComponent(query)}`}
          className="rounded-full border border-slate-800/80 bg-slate-900/60 px-3.5 py-1 text-xs font-medium text-slate-300 backdrop-blur-md transition-all duration-200 hover:border-indigo-500/50 hover:bg-slate-800 hover:text-white hover:shadow-lg hover:shadow-indigo-500/20"
        >
          {query}
        </Link>
      ))}
    </div>
  );
}
