'use client';

import { useEffect, useState } from 'react';
import { FilterSidebar, type SearchFilters } from '@/components/FilterSidebar';
import { ProjectCard, type ProjectCardData } from '@/components/ProjectCard';
import { SearchAutocomplete } from '@/components/SearchAutocomplete';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult extends ProjectCardData {
  distance: number;
}

const emptyFilters: SearchFilters = {
  category: '',
  license: '',
  language: '',
  minStars: '',
  tags: '',
};

export function ProjectBrowser({
  initialQuery,
  categories,
  initialProjects,
}: {
  initialQuery: string;
  categories: string[];
  initialProjects: ProjectCardData[];
}): React.JSX.Element {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>(emptyFilters);
  const [results, setResults] = useState<SearchResult[]>(
    initialProjects.map((project) => ({ ...project, distance: 0 }))
  );
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const debouncedFilters = useDebounce(filters, 150);

  useEffect(() => {
    let active = true;
    const hasFilters = Object.values(debouncedFilters).some(Boolean);
    if (debouncedQuery || hasFilters) setLoading(true);

    async function search(): Promise<void> {
      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            query: debouncedQuery,
            filters: {
              category: debouncedFilters.category || undefined,
              license: debouncedFilters.license || undefined,
              language: debouncedFilters.language || undefined,
              minStars: debouncedFilters.minStars
                ? Number(debouncedFilters.minStars)
                : undefined,
              tags: debouncedFilters.tags
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean),
            },
          }),
        });
        const payload = (await response.json()) as { data?: SearchResult[] };
        if (active && response.ok) setResults(payload.data ?? []);
      } catch {
        // Keep initial approved projects visible if search endpoint errors
      } finally {
        if (active) setLoading(false);
      }
    }
    void search();
    return () => {
      active = false;
    };
  }, [debouncedQuery, debouncedFilters]);

  function update(name: keyof SearchFilters, value: string): void {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function clear(): void {
    setFilters(emptyFilters);
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Top Search & Filter Bar Container */}
      <div className="space-y-4">
        <div className="w-full">
          <SearchAutocomplete value={query} onChange={setQuery} large />
        </div>

        {/* Horizontal Filter Bar right along the search box */}
        <FilterSidebar
          categories={categories}
          filters={filters}
          onChange={update}
          onClear={clear}
        />
      </div>

      {/* Main Results Grid - Now using 3 full-width columns */}
      <div aria-live="polite" className="pt-2">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-60 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/40 p-6"
              />
            ))}
          </div>
        ) : results.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-16 text-center backdrop-blur-md">
            <h2 className="text-lg font-bold text-white">No projects found</h2>
            <p className="mt-2 text-sm text-slate-400">
              Try broadening your search intent or clearing specific filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
