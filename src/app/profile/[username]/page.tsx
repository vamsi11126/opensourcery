import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { ProjectCard } from '@/components/ProjectCard';
import { db } from '@/lib/db';
import { User } from 'lucide-react';

export const dynamic = 'force-dynamic';

function badge(score: number): string {
  return score >= 1000
    ? 'Platinum'
    : score >= 500
    ? 'Gold'
    : score >= 200
    ? 'Silver'
    : score >= 50
    ? 'Bronze'
    : 'New contributor';
}

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const user = await db.user.findUnique({
    where: { id: params.username },
    select: { name: true },
  });
  return {
    title: user?.name ? `${user.name}'s Profile - OpenSourcery` : 'Contributor Profile',
    description: 'OpenSourcery community contributor profile.',
  };
}

export default async function ProfilePage({
  params,
}: {
  params: { username: string };
}): Promise<React.JSX.Element> {
  const user = await db.user.findUnique({
    where: { id: params.username },
    include: {
      submittedProjects: {
        orderBy: { submittedAt: 'desc' },
        select: {
          id: true,
          slug: true,
          title: true,
          shortDescription: true,
          tags: true,
          language: true,
          license: true,
          starsCount: true,
          status: true,
        },
      },
    },
  });

  if (!user) notFound();

  const approved = user.submittedProjects.filter(
    (project) => project.status === 'APPROVED'
  );

  return (
    <main className="container min-h-screen py-12 text-slate-100">
      <section className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[22px] bg-slate-950 text-2xl font-black text-white">
              {user.name?.slice(0, 1).toUpperCase() ?? '?'}
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black text-white sm:text-4xl">
              {user.name ?? 'Community member'}
            </h1>
            <Badge className="mt-2.5 border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
              {badge(user.reputation)}
            </Badge>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-800/60 pt-6 sm:grid-cols-4">
          <div>
            <p className="text-3xl font-black text-white">{user.reputation}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
              Reputation
            </p>
          </div>
          <div>
            <p className="text-3xl font-black text-emerald-400">
              {approved.length}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
              Approved
            </p>
          </div>
          <div>
            <p className="text-3xl font-black text-amber-400">
              {
                user.submittedProjects.filter(
                  (project) => project.status === 'PENDING'
                ).length
              }
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
              Pending
            </p>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-400">
              {
                user.submittedProjects.filter(
                  (project) => project.status === 'REJECTED'
                ).length
              }
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
              Rejected
            </p>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-black text-white">Approved submissions</h2>
        {approved.length ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {approved.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400 backdrop-blur-md">
            No approved submissions yet.
          </div>
        )}
      </section>
    </main>
  );
}
