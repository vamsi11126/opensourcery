import { db } from '@/lib/db';

export interface ScrapeAnalyticsSummary {
  totalSources: number;
  activeSources: number;
  totalLogs: number;
  totalProjectsFound: number;
  totalProjectsNew: number;
  totalProjectsApproved: number;
  totalProjectsFlagged: number;
  llmAutoApprovalRate: number; // percentage 0-100
  yieldBySource: Array<{ name: string; type: string; totalFound: number; totalNew: number }>;
}

export async function getScrapeAnalytics(): Promise<ScrapeAnalyticsSummary> {
  try {
    const [sources, logs, projectCounts] = await Promise.all([
      db.scrapedSource.findMany({ select: { id: true, name: true, type: true, isActive: true } }),
      db.scrapeLog.findMany({
        orderBy: { startedAt: 'desc' },
        take: 100,
        include: { source: { select: { name: true, type: true } } },
      }),
      db.project.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ]);

    const statusMap = new Map(projectCounts.map((item) => [item.status, item._count._all]));
    const totalApproved = statusMap.get('APPROVED') ?? 0;
    const totalFlagged = statusMap.get('FLAGGED') ?? 0;
    const totalPending = statusMap.get('PENDING') ?? 0;
    const totalProjects = totalApproved + totalFlagged + totalPending;

    const llmAutoApprovalRate = totalProjects > 0
      ? Math.round((totalApproved / totalProjects) * 100)
      : 100;

    let totalFound = 0;
    let totalNew = 0;

    const sourceMap = new Map<string, { name: string; type: string; totalFound: number; totalNew: number }>();

    for (const log of logs) {
      totalFound += log.projectsFound;
      totalNew += log.projectsNew;

      const key = log.sourceId;
      const current = sourceMap.get(key) ?? {
        name: log.source.name,
        type: log.source.type,
        totalFound: 0,
        totalNew: 0,
      };

      sourceMap.set(key, {
        ...current,
        totalFound: current.totalFound + log.projectsFound,
        totalNew: current.totalNew + log.projectsNew,
      });
    }

    return {
      totalSources: sources.length,
      activeSources: sources.filter((s) => s.isActive).length,
      totalLogs: logs.length,
      totalProjectsFound: totalFound,
      totalProjectsNew: totalNew,
      totalProjectsApproved: totalApproved,
      totalProjectsFlagged: totalFlagged,
      llmAutoApprovalRate,
      yieldBySource: Array.from(sourceMap.values()),
    };
  } catch {
    return {
      totalSources: 0,
      activeSources: 0,
      totalLogs: 0,
      totalProjectsFound: 0,
      totalProjectsNew: 0,
      totalProjectsApproved: 0,
      totalProjectsFlagged: 0,
      llmAutoApprovalRate: 0,
      yieldBySource: [],
    };
  }
}
