import { db } from '@/lib/db';

export interface ReleaseInfo {
  tagName: string;
  name: string;
  publishedAt: Date;
  htmlUrl: string;
  bodySnippet: string;
}

/** Fetch latest release info from GitHub API for a repository URL. */
export async function fetchGitHubRelease(repoUrl: string): Promise<ReleaseInfo | null> {
  try {
    const url = new URL(repoUrl);
    if (!url.hostname.includes('github.com')) return null;

    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;

    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, '');

    const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases/latest`, {
      headers: { accept: 'application/vnd.github+json', 'user-agent': 'OpenSourcery' },
      next: { revalidate: 7200 },
    });

    if (!response.ok) return null;
    const data = await response.json() as {
      tag_name?: string;
      name?: string;
      published_at?: string;
      html_url?: string;
      body?: string;
    };

    if (!data.tag_name) return null;

    return {
      tagName: data.tag_name,
      name: data.name ?? data.tag_name,
      publishedAt: data.published_at ? new Date(data.published_at) : new Date(),
      htmlUrl: data.html_url ?? repoUrl,
      bodySnippet: (data.body ?? '').slice(0, 300),
    };
  } catch {
    return null;
  }
}

/** Sync latest release info and update repository commit/release dates in DB. */
export async function syncProjectRelease(projectId: string, sourceUrl: string): Promise<ReleaseInfo | null> {
  const release = await fetchGitHubRelease(sourceUrl);
  if (!release) return null;

  try {
    await db.project.update({
      where: { id: projectId },
      data: {
        lastCommitDate: release.publishedAt,
      },
    });
  } catch {
    // Ignore updates if project deleted concurrently
  }

  return release;
}
