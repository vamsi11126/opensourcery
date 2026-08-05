import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { ModerationActions } from '@/components/ModerationActions';
import {
  ScrapeDashboard,
  type ScrapeLogView,
  type ScrapedSourceView,
} from '@/components/ScrapeDashboard';
import { ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Admin Console - OpenSourcery',
  description: 'Review submissions and manage source scraping.',
};

export const dynamic = 'force-dynamic';

export default async function AdminPage(): Promise<React.JSX.Element> {
  const session = await auth();

  const [projects, logs, sources] = await Promise.all([
    db.project.findMany({
      where: { status: { in: ['PENDING', 'FLAGGED'] } },
      orderBy: { submittedAt: 'asc' },
      include: {
        submittedBy: { select: { name: true, email: true } },
      },
    }),
    db.scrapeLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: 20,
      include: {
        source: { select: { name: true, type: true } },
      },
    }),
    db.scrapedSource.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <main className="container min-h-screen py-12 text-slate-100">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-white sm:text-5xl">
            Admin console
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Moderate community submissions and manage catalog ingestion.
          </p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-black text-white">Moderation queue</h2>
        <div className="mt-5 overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-xl">
          {projects.length ? (
            projects.map((project) => (
              <div
                key={project.id}
                className="flex flex-col gap-4 border-b border-slate-800/80 p-6 last:border-0 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-white text-lg">
                      {project.title}
                    </h3>
                    <Badge
                      className={
                        project.status === 'FLAGGED'
                          ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                      }
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-300">
                    {project.shortDescription}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Submitted by{' '}
                    <span className="text-slate-200 font-semibold">
                      {project.submittedBy?.name ??
                        project.submittedBy?.email ??
                        'unknown'}
                    </span>
                  </p>
                </div>
                <ModerationActions projectId={project.id} />
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-400">
              The moderation queue is clear.
            </div>
          )}
        </div>
      </section>

      <ScrapeDashboard
        canRun={session?.user.role === 'ADMIN'}
        logs={logs.map(
          (log): ScrapeLogView => ({
            id: log.id,
            projectsFound: log.projectsFound,
            projectsNew: log.projectsNew,
            projectsUpdated: log.projectsUpdated,
            status: log.status,
            startedAt: log.startedAt.toISOString(),
            source: log.source,
          })
        )}
        sources={sources.map(
          (source): ScrapedSourceView => ({
            id: source.id,
            name: source.name,
            type: source.type,
            url: source.url,
            isActive: source.isActive,
            lastScrapedAt: source.lastScrapedAt?.toISOString() ?? null,
          })
        )}
      />
    </main>
  );
}
