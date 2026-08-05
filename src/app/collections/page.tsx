import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { Bookmark, Sparkles } from 'lucide-react';
import { TiltCard } from '@/components/3d/TiltCard';

export const metadata: Metadata = {
  title: 'Project Collections - OpenSourcery',
  description: 'Browse curated collections of open-source projects.',
};

export const revalidate = 300;
export const dynamic = 'force-dynamic';

export default async function CollectionsPage(): Promise<React.JSX.Element> {
  const [collections, session] = await Promise.all([
    db.collection.findMany({
      where: { isPublic: true },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        author: { select: { name: true } },
        _count: { select: { projects: true } },
      },
    }),
    auth(),
  ]);

  return (
    <main className="container min-h-screen py-12 text-slate-100">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-400">
            <Bookmark className="h-4 w-4" />
            Curated Stacks
          </p>
          <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">
            Project collections
          </h1>
          <p className="mt-3 text-sm text-slate-300">
            Explore stacks and toolsets curated by the developer community.
          </p>
        </div>

        {session && (
          <Link
            href="/collections/manage"
            className="rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
          >
            Manage yours
          </Link>
        )}
      </div>

      {collections.length ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Link
              href={`/collections/${collection.slug}`}
              key={collection.id}
              className="block h-full"
            >
              <TiltCard
                maxTilt={8}
                scale={1.02}
                glare={true}
                className="group relative flex h-full flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white transition-colors group-hover:text-indigo-300">
                      {collection.name}
                    </h2>
                    <Sparkles className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100 text-indigo-400" />
                  </div>
                  <p className="line-clamp-3 text-sm leading-relaxed text-slate-400">
                    {collection.description ??
                      'A community-curated collection of open-source projects.'}
                  </p>
                </div>

                <div className="mt-6 border-t border-slate-800/60 pt-4 text-xs font-medium text-slate-400">
                  <span>{collection._count.projects} projects</span> ·{' '}
                  <span className="text-slate-300">
                    by {collection.author.name ?? 'community member'}
                  </span>
                </div>
              </TiltCard>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-16 text-center text-slate-400 backdrop-blur-md">
          No public collections available yet.
        </div>
      )}
    </main>
  );
}
