'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Send } from 'lucide-react';

interface CommentView {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string | null; image: string | null };
  replies: CommentView[];
}

export function CommentSection({
  slug,
  signedIn,
}: {
  slug: string;
  signedIn: boolean;
}): React.JSX.Element {
  const [comments, setComments] = useState<CommentView[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`/api/projects/${slug}/comments`)
      .then((response) => response.json())
      .then((payload: { data?: CommentView[] }) => {
        if (active) setComments(payload.data ?? []);
      })
      .catch(() => {
        if (active) setError('Unable to load comments.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  async function addComment(
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    if (!content.trim()) return;
    const response = await fetch(`/api/projects/${slug}/comments`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    const payload = (await response.json()) as {
      data?: CommentView;
      error?: string;
    };
    if (!response.ok || !payload.data) {
      setError(payload.error ?? 'Unable to post comment.');
      return;
    }
    setComments((current) => [payload.data as CommentView, ...current]);
    setContent('');
  }

  return (
    <section className="mt-20 border-t border-slate-800/80 pt-12 text-slate-100">
      <h2 className="flex items-center gap-2 text-2xl font-black text-white">
        <MessageSquare className="h-5 w-5 text-indigo-400" />
        Discussion
      </h2>

      {signedIn ? (
        <form onSubmit={addComment} className="mt-6 flex gap-3">
          <Input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Share something useful about this project…"
            aria-label="Comment"
            className="flex-1"
          />
          <Button type="submit">
            Comment <Send className="ml-2 h-4 w-4" />
          </Button>
        </form>
      ) : (
        <p className="mt-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 text-xs text-slate-400 backdrop-blur-md">
          Sign in to join the community discussion.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-xs font-semibold text-rose-400">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-8 space-y-4">
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 p-5 backdrop-blur-sm">
            <Skeleton className="h-4 w-36 rounded-md mb-3" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="mt-2 h-4 w-3/4 rounded-md" />
          </div>
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 p-5 backdrop-blur-sm">
            <Skeleton className="h-4 w-28 rounded-md mb-3" />
            <Skeleton className="h-4 w-5/6 rounded-md" />
          </div>
        </div>
      ) : comments.length ? (
        <div className="mt-8 space-y-6">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-2xl border border-slate-800/60 bg-slate-900/30 p-5 backdrop-blur-sm"
            >
              <p className="text-sm font-semibold text-white">
                {comment.author.name ?? 'Community member'}{' '}
                <span className="text-xs font-normal text-slate-400">
                  · {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {comment.content}
              </p>
              {comment.replies.length > 0 && (
                <div className="ml-5 mt-4 space-y-4 border-l border-slate-800 pl-4">
                  {comment.replies.map((reply) => (
                    <div key={reply.id}>
                      <p className="text-xs font-semibold text-white">
                        {reply.author.name ?? 'Community member'}
                      </p>
                      <p className="mt-1 text-xs text-slate-300">
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-xs text-slate-400">
          No comments yet. Be the first to share your thoughts.
        </p>
      )}
    </section>
  );
}
