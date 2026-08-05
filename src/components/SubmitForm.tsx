'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SubmitForm(): React.JSX.Element {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setPending(true);
    setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = (await response.json()) as {
      data?: { slug: string };
      error?: string;
    };
    setPending(false);
    if (!response.ok || result.error) {
      setError(result.error ?? 'Could not submit project.');
      return;
    }
    router.push(`/projects/${result.data?.slug}`);
  }

  return (
    <form onSubmit={submit} className="space-y-5 text-slate-100">
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-300"
        >
          {error}
        </p>
      )}

      <div>
        <label
          htmlFor="sourceUrl"
          className="mb-1.5 block text-xs font-semibold text-slate-300 uppercase tracking-wider"
        >
          Source URL
        </label>
        <Input
          id="sourceUrl"
          name="sourceUrl"
          type="url"
          required
          placeholder="https://github.com/owner/project"
        />
      </div>

      <div>
        <label
          htmlFor="title"
          className="mb-1.5 block text-xs font-semibold text-slate-300 uppercase tracking-wider"
        >
          Project Title
        </label>
        <Input
          id="title"
          name="title"
          required
          placeholder="e.g. Next.js, Prisma, Tailwind CSS"
        />
      </div>

      <div>
        <label
          htmlFor="shortDescription"
          className="mb-1.5 block text-xs font-semibold text-slate-300 uppercase tracking-wider"
        >
          Short Description{' '}
          <span className="font-normal text-slate-400">
            (280 characters max)
          </span>
        </label>
        <textarea
          id="shortDescription"
          name="shortDescription"
          required
          maxLength={280}
          rows={4}
          className="w-full rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-sm text-slate-100 placeholder:text-slate-500 backdrop-blur-md outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          placeholder="Describe what people can build using this tool..."
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="tags"
            className="mb-1.5 block text-xs font-semibold text-slate-300 uppercase tracking-wider"
          >
            Tags
          </label>
          <Input
            id="tags"
            name="tags"
            placeholder="react, ai, developer-tools"
          />
        </div>

        <div>
          <label
            htmlFor="license"
            className="mb-1.5 block text-xs font-semibold text-slate-300 uppercase tracking-wider"
          >
            License
          </label>
          <Input id="license" name="license" placeholder="MIT" />
        </div>
      </div>

      <Button type="submit" disabled={pending} className="w-full font-bold">
        {pending ? 'Submitting…' : 'Submit for review'}
      </Button>
    </form>
  );
}
