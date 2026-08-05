'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export interface ScrapeLogView {
  id: string;
  projectsFound: number;
  projectsNew: number;
  projectsUpdated: number;
  status: string;
  startedAt: string;
  source: { name: string; type: string };
}

export interface ScrapedSourceView {
  id: string;
  name: string;
  type: string;
  url: string;
  isActive: boolean;
  lastScrapedAt: string | null;
}

function formatIndiaDate(value: string, includeTime: boolean): string {
  const date = new Date(value);
  const indiaDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  const day = String(indiaDate.getUTCDate()).padStart(2, '0');
  const month = String(indiaDate.getUTCMonth() + 1).padStart(2, '0');
  const year = indiaDate.getUTCFullYear();
  if (!includeTime) return `${day}/${month}/${year}`;
  const hours24 = indiaDate.getUTCHours();
  const hours = hours24 % 12 || 12;
  const meridiem = hours24 >= 12 ? 'pm' : 'am';
  const minutes = String(indiaDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(indiaDate.getUTCSeconds()).padStart(2, '0');
  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds} ${meridiem}`;
}

export function ScrapeDashboard({
  logs,
  sources,
  canRun,
}: {
  logs: ScrapeLogView[];
  sources: ScrapedSourceView[];
  canRun: boolean;
}): React.JSX.Element {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');
  const [sourceState, setSourceState] = useState(sources);

  async function runScrape(): Promise<void> {
    setRunning(true);
    try {
      const response = await fetch('/api/scrape', { method: 'POST' });
      const payload = (await response.json()) as {
        data?: {
          sourcesScraped: number;
          projectsNew: number;
          results?: Array<{ status: string }>;
        };
        error?: string;
      };
      const failed =
        payload.data?.results?.filter((result) => result.status === 'failed')
          .length ?? 0;
      setMessage(
        response.ok && payload.data
          ? `Scraped ${payload.data.sourcesScraped} sources and found ${
              payload.data.projectsNew
            } new projects${
              failed
                ? ` (${failed} source${failed === 1 ? '' : 's'} failed).`
                : '.'
            }`
          : payload.error ?? 'Scrape failed.'
      );
    } catch {
      setMessage('Scrape failed. Check the server logs and try again.');
    } finally {
      setRunning(false);
    }
  }

  async function toggle(source: ScrapedSourceView): Promise<void> {
    const next = !source.isActive;
    const response = await fetch(`/api/scrape/sources/${source.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isActive: next }),
    });
    if (response.ok)
      setSourceState((current) =>
        current.map((item) =>
          item.id === source.id ? { ...item, isActive: next } : item
        )
      );
  }

  return (
    <section className="mt-14 text-slate-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Scrapes & Ingestion</h2>
          <p className="mt-1 text-xs text-slate-300">
            Source discovery and scheduled project ingestion runs.
          </p>
        </div>
        {canRun && (
          <Button onClick={() => void runScrape()} disabled={running}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${running ? 'animate-spin' : ''}`}
            />
            {running ? 'Scraping…' : 'Run scrape now'}
          </Button>
        )}
      </div>

      {message && (
        <p role="status" className="mt-3 text-xs font-semibold text-indigo-300">
          {message}
        </p>
      )}

      {/* Log Table Container */}
      <div className="mt-5 overflow-x-auto rounded-3xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-xl">
        <table className="w-full min-w-[680px] text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="p-4">Source</th>
              <th className="p-4">Date</th>
              <th className="p-4">Found</th>
              <th className="p-4">New</th>
              <th className="p-4">Updated</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                <td className="p-4 font-semibold text-white">
                  {log.source.name}
                </td>
                <td className="p-4 text-slate-400">
                  {formatIndiaDate(log.startedAt, true)}
                </td>
                <td className="p-4 text-slate-200">{log.projectsFound}</td>
                <td className="p-4 text-indigo-300 font-semibold">{log.projectsNew}</td>
                <td className="p-4 text-slate-200">{log.projectsUpdated}</td>
                <td className="p-4">
                  <Badge
                    className={
                      log.status === 'success'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                    }
                  >
                    {log.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!logs.length && (
          <p className="p-8 text-center text-slate-400">No scrape runs yet.</p>
        )}
      </div>

      <h3 className="mt-10 text-lg font-bold text-white">Configured sources</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {sourceState.map((source) => (
          <div
            key={source.id}
            className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl shadow-lg"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold text-white text-sm">{source.name}</span>
              <button
                type="button"
                onClick={() => void toggle(source)}
                className="rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <Badge
                  className={
                    source.isActive
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }
                >
                  {source.isActive ? 'Active' : 'Disabled'}
                </Badge>
              </button>
            </div>
            <p className="mt-2 truncate text-xs font-mono text-slate-400">
              {source.url}
            </p>
            <p className="mt-2 text-[11px] text-slate-400">
              Last scraped:{' '}
              <span className="text-slate-300">
                {source.lastScrapedAt
                  ? formatIndiaDate(source.lastScrapedAt, false)
                  : 'Never'}
              </span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
