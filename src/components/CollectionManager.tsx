'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderPlus, Trash2 } from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isPublic: boolean;
  _count?: { projects: number };
}

export function CollectionManager(): React.JSX.Element {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  async function load(): Promise<void> {
    const response = await fetch('/api/collections?mine=1');
    const payload = (await response.json()) as { data?: Collection[] };
    setCollections(payload.data ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function create(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setPending(true);
    setMessage('');
    const response = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, description, isPublic }),
    });
    const payload = (await response.json()) as { error?: string };
    if (response.ok) {
      setName('');
      setDescription('');
      setMessage('Collection created successfully.');
      await load();
    } else setMessage(payload.error ?? 'Could not create collection.');
    setPending(false);
  }

  async function remove(collection: Collection): Promise<void> {
    if (!window.confirm(`Delete “${collection.name}”?`)) return;
    const response = await fetch(`/api/collections/${collection.slug}`, {
      method: 'DELETE',
    });
    if (response.ok)
      setCollections((current) =>
        current.filter((item) => item.id !== collection.id)
      );
    else setMessage('Could not delete collection.');
  }

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[340px_1fr] text-slate-100">
      <form
        onSubmit={(event) => void create(event)}
        className="h-fit rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl"
      >
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          <FolderPlus className="h-5 w-5 text-indigo-400" />
          Create a collection
        </h2>

        <div className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="collection-name"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              Collection Name
            </label>
            <Input
              id="collection-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={80}
              placeholder="e.g. AI Tools for React"
            />
          </div>

          <div>
            <label
              htmlFor="collection-description"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              Description
            </label>
            <textarea
              id="collection-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-100 placeholder:text-slate-500 backdrop-blur-md outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="What makes this list useful?"
            />
          </div>

          <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) => setIsPublic(event.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500"
            />
            Make collection public
          </label>

          <Button disabled={pending} className="w-full font-bold">
            {pending ? 'Creating…' : 'Create collection'}
          </Button>

          {message && (
            <p role="status" className="text-xs font-semibold text-indigo-300">
              {message}
            </p>
          )}
        </div>
      </form>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">Your collections</h2>
        <div className="space-y-3">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl shadow-lg transition-all hover:border-slate-700"
            >
              <div>
                <Link
                  href={`/collections/${collection.slug}`}
                  className="font-bold text-white hover:text-indigo-300 transition-colors"
                >
                  {collection.name}
                </Link>
                <p className="mt-1 text-xs text-slate-400">
                  {collection._count?.projects ?? 0} projects ·{' '}
                  <span className="text-indigo-300">
                    {collection.isPublic ? 'Public' : 'Private'}
                  </span>
                </p>
              </div>

              <Button
                variant="outline"
                className="text-xs border-rose-500/30 text-rose-400 hover:border-rose-500/60 hover:bg-rose-500/10 hover:text-rose-300"
                onClick={() => void remove(collection)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          ))}

          {!collections.length && (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400 backdrop-blur-md">
              You have not created any collections yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
