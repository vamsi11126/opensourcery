import type { Metadata } from 'next';
import { ProjectBrowser } from '@/components/ProjectBrowser';
import { db } from '@/lib/db';

export const metadata: Metadata = { title: 'Browse projects', description: 'Browse and semantically search approved open-source projects.' };
export const dynamic = 'force-dynamic';

export default async function ProjectsPage({ searchParams }: { searchParams: { q?: string } }): Promise<React.JSX.Element> {
  const [categories, initialProjects] = await Promise.all([db.project.findMany({ where: { status: 'APPROVED', category: { not: null } }, select: { category: true }, distinct: ['category'] }), db.project.findMany({ where: { status: 'APPROVED' }, orderBy: { submittedAt: 'desc' }, select: { id: true, slug: true, title: true, shortDescription: true, tags: true, language: true, license: true, starsCount: true } })]);
  return <main className="container py-12"><div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-wider text-blue-600">Project catalog</p><h1 className="mt-2 text-4xl font-black">Browse open source</h1><p className="mt-3 text-slate-600">Describe what you need and refine the results with filters.</p></div><ProjectBrowser initialQuery={searchParams.q?.trim() ?? ''} categories={categories.flatMap((item) => item.category ? [item.category] : [])} initialProjects={initialProjects} /></main>;
}
