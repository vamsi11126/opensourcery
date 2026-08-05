import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProjectCard } from '@/components/ProjectCard';
import { db } from '@/lib/db';
import { Bookmark } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const collection = await db.collection.findUnique({
    where: { slug: params.slug },
    select: { name: true, description: true },
  });
  return collection
    ? {
        title: `${collection.name} - Collection`,
        description:
          collection.description ??
          `A curated OpenSourcery collection: ${collection.name}.`,
      }
    : { title: 'Collection not found' };
}

export default async function CollectionDetailPage({
  params,
}: {
  params: { slug: string };
}): Promise<React.JSX.Element> {
  const collection = await db.collection.findUnique({
    where: { slug: params.slug },
    include: {
      author: { select: { name: true } },
      projects: {
        orderBy: { addedAt: 'desc' },
        include: {
          project: {
            select: {
              id: true,
              slug: true,
              title: true,
              shortDescription: true,
              tags: true,
              language: true,
              license: true,
              starsCount: true,
            },
          },
        },
      },
    },
  });

  if (!collection || !collection.isPublic) notFound();

  return (
    <main className="container min-h-screen py-12 text-slate-100">
      <div className="max-w-3xl">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-400">
          <Bookmark className="h-4 w-4" />
          Community Collection
        </p>
        <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">
          {collection.name}
        </h1>
        {collection.description && (
          <p className="mt-4 text-lg leading-relaxed text-slate-300">
            {collection.description}
          </p>
        )}
        <p className="mt-3 text-xs text-slate-400">
          Curated by{' '}
          <span className="font-semibold text-slate-200">
            {collection.author.name ?? 'community member'}
          </span>
        </p>
      </div>

      {collection.projects.length ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collection.projects.map((entry) => (
            <div key={entry.projectId} className="flex flex-col">
              <ProjectCard project={entry.project} />
              {entry.note && (
                <p className="mt-2 px-2 text-xs italic text-slate-400">
                  &ldquo;{entry.note}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-16 text-center text-slate-400 backdrop-blur-md">
          This collection has no projects yet.
        </div>
      )}
    </main>
  );
}
