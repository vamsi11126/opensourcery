'use client';

import { Search, Sparkles, History, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';

interface Suggestion {
  type: 'project' | 'tag';
  value: string;
  slug?: string;
}

export function SearchAutocomplete({
  value,
  onChange,
  large = false,
}: {
  value: string;
  onChange: (value: string) => void;
  large?: boolean;
}): React.JSX.Element {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);
  const debounced = useDebounce(value, 200);

  useEffect(() => {
    try {
      setRecent(
        JSON.parse(
          window.localStorage.getItem('opensourcery-recent-searches') ?? '[]'
        ) as string[]
      );
    } catch {
      setRecent([]);
    }
  }, []);

  useEffect(() => {
    if (!debounced.trim()) {
      setSuggestions([]);
      return;
    }
    fetch(`/api/search/suggestions?q=${encodeURIComponent(debounced)}`)
      .then((response) => response.json())
      .then((payload: { data?: Suggestion[] }) =>
        setSuggestions(payload.data ?? [])
      )
      .catch(() => setSuggestions([]));
  }, [debounced]);

  function search(term: string): void {
    const normalized = term.trim();
    if (!normalized) return;
    const next = [
      normalized,
      ...recent.filter(
        (item) => item.toLowerCase() !== normalized.toLowerCase()
      ),
    ].slice(0, 6);
    setRecent(next);
    window.localStorage.setItem(
      'opensourcery-recent-searches',
      JSON.stringify(next)
    );
    router.push(`/projects?q=${encodeURIComponent(normalized)}`);
  }

  function submit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    search(value);
  }

  const visible: Suggestion[] = value.trim()
    ? suggestions
    : recent.map((item) => ({ type: 'tag', value: item }));

  return (
    <div className="relative w-full">
      <form onSubmit={submit} className="relative">
        <Search className="absolute left-5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-indigo-400 transition-colors group-hover:text-cyan-300" />
        
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 200)}
          placeholder="Describe what you want to build (e.g., lightweight vector database for React)..."
          aria-label="Search projects"
          className={`w-full border-slate-800 bg-slate-900/80 pl-14 pr-24 text-slate-100 placeholder-slate-400 backdrop-blur-xl transition-all duration-300 focus:border-indigo-500 focus:bg-slate-950 focus:ring-4 focus:ring-indigo-500/20 ${
            large ? 'h-16 rounded-2xl text-base shadow-2xl shadow-indigo-950/50' : 'h-12 rounded-xl text-sm'
          }`}
        />

        <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 items-center gap-1 sm:flex">
          <kbd className="flex h-6 items-center gap-1 rounded border border-slate-700 bg-slate-800/80 px-2 font-mono text-[10px] font-semibold text-slate-400 shadow-inner">
            <span>Press</span>
            <CornerDownLeft className="h-3 w-3 text-indigo-400" />
          </kbd>
        </div>
      </form>

      {focused && visible.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-3 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 p-2.5 shadow-2xl backdrop-blur-2xl">
          <div className="mb-2 flex items-center justify-between px-3 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1.5">
              {value.trim() ? (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  Suggestions
                </>
              ) : (
                <>
                  <History className="h-3.5 w-3.5 text-blue-400" />
                  Recent Searches
                </>
              )}
            </span>
          </div>

          <div className="space-y-1">
            {visible.map((suggestion) => (
              <button
                type="button"
                key={`${suggestion.type}-${suggestion.value}`}
                onMouseDown={() =>
                  suggestion.slug
                    ? router.push(`/projects/${suggestion.slug}`)
                    : search(suggestion.value)
                }
                className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm text-slate-200 transition-colors hover:bg-slate-900 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <span className="text-slate-400">
                    {suggestion.type === 'tag' ? '#' : '•'}
                  </span>
                  {suggestion.value}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500 opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100" />
              </button>
            ))}
          </div>

          {value.trim() && (
            <button
              type="button"
              onMouseDown={() => search(value)}
              className="mt-2 flex w-full items-center justify-between rounded-xl border-t border-slate-800/80 px-3.5 pt-3 pb-1 text-left text-xs font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
            >
              <span>Search intent &ldquo;{value}&rdquo; in catalog</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
