'use client';

import { Filter, RotateCcw, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface SearchFilters {
  category: string;
  license: string;
  language: string;
  minStars: string;
  tags: string;
}

export function FilterSidebar({
  categories,
  filters,
  onChange,
  onClear,
}: {
  categories: string[];
  filters: SearchFilters;
  onChange: (name: keyof SearchFilters, value: string) => void;
  onClear: () => void;
}): React.JSX.Element {
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="w-full rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 md:p-5 backdrop-blur-xl shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-indigo-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Filter Projects
          </h2>
          {activeCount > 0 && (
            <span className="flex h-5 items-center justify-center rounded-full bg-indigo-500/20 px-2 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
              {activeCount} active
            </span>
          )}
        </div>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1 text-xs font-semibold text-indigo-400 transition-colors hover:border-indigo-500/40 hover:text-indigo-300"
          >
            <RotateCcw className="h-3 w-3" />
            Reset all
          </button>
        )}
      </div>

      {/* Horizontal grid layout for filters */}
      <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label
            htmlFor="category"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400"
          >
            Category
          </label>
          <select
            id="category"
            value={filters.category}
            onChange={(event) => onChange('category', event.target.value)}
            className="h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-slate-200 transition-colors focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="license"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400"
          >
            License
          </label>
          <select
            id="license"
            value={filters.license}
            onChange={(event) => onChange('license', event.target.value)}
            className="h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-slate-200 transition-colors focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All licenses</option>
            {['MIT', 'GPL-3.0', 'Apache-2.0', 'BSD-3-Clause', 'MPL-2.0'].map(
              (license) => (
                <option key={license} value={license}>
                  {license}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label
            htmlFor="language"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400"
          >
            Language
          </label>
          <Input
            id="language"
            value={filters.language}
            onChange={(event) => onChange('language', event.target.value)}
            placeholder="e.g. TypeScript"
            className="h-10 rounded-xl border-slate-800 bg-slate-950 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="minStars"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400"
          >
            Min Stars
          </label>
          <Input
            id="minStars"
            value={filters.minStars}
            onChange={(event) => onChange('minStars', event.target.value)}
            type="number"
            min="0"
            placeholder="0"
            className="h-10 rounded-xl border-slate-800 bg-slate-950 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="tags"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400"
          >
            Tags
          </label>
          <Input
            id="tags"
            value={filters.tags}
            onChange={(event) => onChange('tags', event.target.value)}
            placeholder="ai, react"
            className="h-10 rounded-xl border-slate-800 bg-slate-950 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}
