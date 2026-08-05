import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ExternalLink, Star, Code2, Globe } from 'lucide-react';
import { auth } from '@/lib/auth';
import { BookmarkButton } from '@/components/BookmarkButton';
import { CollectionButton } from '@/components/CollectionButton';
import { CommentSection } from '@/components/CommentSection';
import { ProjectCard } from '@/components/ProjectCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { formatStars } from '@/lib/utils';
import { getStoredEmbedding, vectorSearch } from '@/lib/vector-search';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const project = await db.project.findUnique({
    where: { slug: params.slug },
    select: { title: true, shortDescription: true },
  });
  return project
    ? {
        title: `${project.title} - OpenSourcery`,
        description: project.shortDescription,
        openGraph: {
          title: project.title,
          description: project.shortDescription,
          type: 'article',
        },
      }
    : { title: 'Project not found' };
}

export default async function ProjectDetail({
  params,
}: {
  params: { slug: string };
}): Promise<React.JSX.Element> {
  const project = await db.project.findUnique({
    where: { slug: params.slug },
    include: {
      submittedBy: { select: { id: true, name: true, image: true } },
    },
  });

  if (!project || project.status !== 'APPROVED') notFound();

  const session = await auth();
  const saved = session
    ? Boolean(
        await db.userSavedProject.findUnique({
          where: {
            userId_projectId: {
              userId: session.user.id,
              projectId: project.id,
            },
          },
        })
      )
    : false;

  const embedding = await getStoredEmbedding(project.id);
  const similar = embedding
    ? await vectorSearch({ embedding, limit: 4, excludeId: project.id })
    : [];

  return (
    <main className="container min-h-screen py-12 text-slate-100">
      {/* Top Header Section */}
      <div className="max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
            Approved
          </Badge>
          {project.category && (
            <Badge className="border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
              {project.category}
            </Badge>
          )}
        </div>

        <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
          {project.title}
        </h1>
        
        <p className="mt-4 text-lg leading-relaxed text-slate-300 sm:text-xl">
          {project.shortDescription}
        </p>

        {project.submittedBy && (
          <p className="mt-4 text-xs text-slate-400">
            Submitted by{' '}
            <a
              className="font-semibold text-indigo-400 hover:text-indigo-300"
              href={`/profile/${project.submittedBy.id}`}
            >
              {project.submittedBy.name ?? 'Community member'}
            </a>
          </p>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a href={project.sourceUrl} target="_blank" rel="noreferrer">
            <Button>
              View source <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </a>
          {project.homepageUrl && (
            <a href={project.homepageUrl} target="_blank" rel="noreferrer">
              <Button variant="outline">
                <Globe className="mr-2 h-4 w-4 text-indigo-400" />
                Homepage
              </Button>
            </a>
          )}
          {session && (
            <>
              <BookmarkButton projectId={project.id} initialSaved={saved} />
              <CollectionButton projectId={project.id} />
            </>
          )}
        </div>
      </div>

      {/* Main Content & Sidebar Grid */}
      <div className="mt-12 grid gap-10 border-t border-slate-800/80 pt-10 md:grid-cols-[1fr_300px]">
        <article className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Code2 className="h-5 w-5 text-indigo-400" />
            About this project
          </h2>
          <p className="whitespace-pre-wrap leading-relaxed text-slate-300">
            {project.longDescription ?? project.shortDescription}
          </p>

          <div className="pt-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Tags & Technologies
            </p>
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <Badge
                  key={tag}
                  className="border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        </article>

        {/* Sidebar Specifications Card - Dark Glass Panel */}
        <aside className="h-fit rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-3">
            Project Overview
          </h3>
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Stars</dt>
              <dd className="flex items-center gap-1.5 font-bold text-white">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {formatStars(project.starsCount)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-slate-800/60 pt-3">
              <dt className="text-slate-400">License</dt>
              <dd className="font-semibold text-slate-200">
                {project.license ?? 'Not specified'}
              </dd>
            </div>
            <div className="border-t border-slate-800/60 pt-3">
              <dt className="text-slate-400">Languages</dt>
              <dd className="mt-1 font-semibold text-indigo-300">
                {project.language.join(', ') || 'Not specified'}
              </dd>
            </div>
            <div className="border-t border-slate-800/60 pt-3">
              <dt className="text-slate-400">Category</dt>
              <dd className="mt-1 font-semibold text-slate-200">
                {project.category ?? 'Not specified'}
              </dd>
            </div>
          </dl>
        </aside>
      </div>

      {/* Similar Projects Section */}
      {similar.length >= 2 && (
        <section className="mt-20 border-t border-slate-800/80 pt-12">
          <h2 className="text-2xl font-black text-white">Similar projects</h2>
          <p className="mt-2 text-sm text-slate-400">
            More tools with a similar purpose, features, and intent.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((item) => (
              <ProjectCard key={item.id} project={item} />
            ))}
          </div>
        </section>
      )}

      {/* Comment & Discussion Section */}
      <CommentSection slug={project.slug} signedIn={Boolean(session)} />
    </main>
  );
}
