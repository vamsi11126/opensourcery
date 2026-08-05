import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { ProjectCard, type ProjectCardData } from '@/components/ProjectCard';
import { LayoutDashboard, Bookmark, PlusCircle } from 'lucide-react';

export const metadata = {
  title: 'Your Dashboard - OpenSourcery',
  description: 'Manage saved and submitted projects.',
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const session = await auth();
  if (!session) redirect('/login');

  const [submitted, saved] = await Promise.all([
    db.project.findMany({
      where: { submittedById: session.user.id },
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
      },
    }),
    db.userSavedProject.findMany({
      where: { userId: session.user.id },
      orderBy: { savedAt: 'desc' },
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
    }),
  ]);

  return (
    <main className="container min-h-screen py-12 text-slate-100">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <LayoutDashboard className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-white sm:text-5xl">
            Your dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Manage your saved bookmarks and submitted open-source tools.
          </p>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          <Bookmark className="h-5 w-5 text-indigo-400" />
          Saved projects
        </h2>
        {saved.length ? (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map(({ project }) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400 backdrop-blur-md">
            Saved projects will appear here.
          </div>
        )}
      </section>

      <section className="mt-16">
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          <PlusCircle className="h-5 w-5 text-cyan-400" />
          Your submissions
        </h2>
        {submitted.length ? (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {submitted.map((project: ProjectCardData) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400 backdrop-blur-md">
            You haven&apos;t submitted any projects yet.
          </div>
        )}
      </section>
    </main>
  );
}
