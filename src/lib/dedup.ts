import { db } from '@/lib/db';
import type { Prisma, Project } from '@prisma/client';
import { isIP } from 'node:net';

function isLocalOrPrivateHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (!normalized || normalized === 'localhost' || normalized.endsWith('.localhost')) return true;

  if (isIP(normalized)) {
    const version = isIP(normalized);
    if (version === 4) {
      const parts = normalized.split('.').map((part) => Number.parseInt(part, 10));
      return (
        parts[0] === 10 ||
        parts[0] === 127 ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168) ||
        (parts[0] === 169 && parts[1] === 254) ||
        (parts[0] === 0 && parts[1] === 0 && parts[2] === 0 && parts[3] === 0)
      );
    }

    if (version === 6) {
      return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:');
    }
  }

  return false;
}

/** Convert supported source URLs to a stable canonical URL before database lookups. */
export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  const url = new URL(trimmed);

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new TypeError('Only http and https URLs are supported.');
  }
  if (isLocalOrPrivateHostname(url.hostname)) {
    throw new TypeError('Local or private hosts are not allowed.');
  }

  const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
  const parts = url.pathname.split('/').filter(Boolean);
  if (hostname === 'github.com' && parts.length >= 2) return `https://github.com/${parts[0].toLowerCase()}/${parts[1].toLowerCase().replace(/\.git$/, '')}`;
  if (hostname === 'npmjs.com' && parts[0] === 'package' && parts[1]) return `https://www.npmjs.com/package/${parts[1]}`;
  if ((hostname === 'pypi.org' && parts[0] === 'project' && parts[1]) || (hostname === 'pypi.python.org' && parts[0] === 'pypi' && parts[1])) return `https://pypi.org/project/${parts[1].toLowerCase()}/`;
  url.hostname = hostname;
  url.hash = '';
  url.search = '';
  url.pathname = `/${parts.join('/')}`.replace(/\/(tree|blob)\/(main|master|develop)$/, '').replace(/\/$/, '');
  return url.toString();
}

export async function findDuplicate(sourceUrl: string): Promise<Project | null> { return db.project.findUnique({ where: { sourceUrl: normalizeUrl(sourceUrl) } }); }
export async function isDuplicate(sourceUrl: string): Promise<boolean> { return (await findDuplicate(sourceUrl)) !== null; }

export async function findOrUpdate(sourceUrl: string, data: Prisma.ProjectCreateInput): Promise<Project> {
  const normalized = normalizeUrl(sourceUrl);
  const existing = await db.project.findUnique({ where: { sourceUrl: normalized } });
  if (existing) return db.project.update({ where: { id: existing.id }, data: { starsCount: data.starsCount, lastCommitDate: data.lastCommitDate } });
  return db.project.create({ data: { ...data, sourceUrl: normalized } });
}
