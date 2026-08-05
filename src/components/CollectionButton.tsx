'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FolderPlus } from 'lucide-react';

interface CollectionOption {
  id: string;
  name: string;
  slug: string;
}

export function CollectionButton({
  projectId,
}: {
  projectId: string;
}): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [message, setMessage] = useState('');

  async function show(): Promise<void> {
    setOpen((current) => !current);
    if (!collections.length) {
      const response = await fetch('/api/collections?mine=1');
      const payload: { data?: CollectionOption[] } =
        (await response.json()) as { data?: CollectionOption[] };
      setCollections(payload.data ?? []);
    }
  }

  async function add(slug: string): Promise<void> {
    const response = await fetch(`/api/collections/${slug}/projects`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ projectId }),
    });
    setMessage(response.ok ? 'Added to collection!' : 'Could not add');
  }

  return (
    <div className="relative">
      <Button variant="outline" onClick={() => void show()}>
        <FolderPlus className="mr-2 h-4 w-4 text-indigo-400" />
        Add to collection
      </Button>

      {open && (
        <div className="absolute left-0 top-12 z-20 w-64 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-2xl">
          <p className="mb-2.5 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Your collections
          </p>
          {collections.length ? (
            <div className="space-y-1">
              {collections.map((collection) => (
                <button
                  type="button"
                  key={collection.id}
                  onClick={() => void add(collection.slug)}
                  className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-900 hover:text-white"
                >
                  {collection.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="px-2 py-1 text-xs text-slate-400">
              Create a collection from the collections page first.
            </p>
          )}
          {message && (
            <p className="mt-2.5 px-2 text-xs font-semibold text-emerald-400">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
