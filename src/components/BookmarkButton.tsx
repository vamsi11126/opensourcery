'use client';

import { Bookmark } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function BookmarkButton({
  projectId,
  initialSaved,
}: {
  projectId: string;
  initialSaved: boolean;
}): React.JSX.Element {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  async function toggle(): Promise<void> {
    const next = !saved;
    setSaved(next);
    setPending(true);
    const response = await fetch(
      next
        ? '/api/bookmarks'
        : `/api/bookmarks?projectId=${encodeURIComponent(projectId)}`,
      {
        method: next ? 'POST' : 'DELETE',
        headers: next ? { 'content-type': 'application/json' } : undefined,
        body: next ? JSON.stringify({ projectId }) : undefined,
      }
    );
    if (!response.ok) setSaved(!next);
    setPending(false);
  }

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() => void toggle()}
      aria-pressed={saved}
      aria-label={saved ? 'Remove bookmark' : 'Save project'}
    >
      <Bookmark
        className={`mr-2 h-4 w-4 transition-colors ${
          saved ? 'fill-indigo-400 text-indigo-400' : 'text-slate-400'
        }`}
      />
      {saved ? 'Saved' : 'Save project'}
    </Button>
  );
}
