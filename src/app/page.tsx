import Link from 'next/link';
import { ArrowRight, Sparkles, Code2, Database, Shield, Zap, Search, FolderGit2 } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { TrendingSearches } from '@/components/TrendingSearches';
import { ProjectCard, type ProjectCardData } from '@/components/ProjectCard';
import { Hero3DCanvas } from '@/components/3d/Hero3DCanvas';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { getListedProjectsCount } from '@/lib/projects';

export const metadata = {
  title: 'OpenSourcery - Semantic Intent Discovery for Open Source',
  description: 'Find open-source projects by describing what you want to build using semantic AI search.',
};

export const dynamic = 'force-dynamic';

async function featured(): Promise<ProjectCardData[]> {
  try {
    return await db.project.findMany({
      where: { status: 'APPROVED' },
      orderBy: { starsCount: 'desc' },
      take: 6,
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
    });
  } catch {
    return [];
  }
}

export default async function Home(): Promise<React.JSX.Element> {
  const [projects, projectCount] = await Promise.all([
    featured(),
    getListedProjectsCount(),
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'OpenSourcery',
    description: 'Discover open-source projects by what you want to build.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://opensourcery.app',
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section with Interactive 3D Canvas Background */}
      <section className="relative overflow-hidden pt-24 pb-28 sm:pt-32 sm:pb-36">
        <Hero3DCanvas />

        {/* Top & Ambient Gradient Lighting Overlay */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-cyan-400/20 blur-3xl" />

        <div className="container relative z-10 max-w-5xl text-center">
          {/* Badge indicator */}
          <div className="mx-auto mb-8 flex flex-wrap items-center justify-center gap-2 rounded-full border border-indigo-500/30 bg-slate-900/80 px-4 py-1.5 text-xs font-semibold text-indigo-300 backdrop-blur-xl shadow-lg shadow-indigo-950/40 animate-float">
            <Sparkles className="h-4 w-4 text-cyan-400 animate-spin-slow" />
            <span>Semantic Intent Search Engine</span>
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="hidden h-3 w-px bg-slate-700 sm:inline-block" />
            <span className="text-cyan-300 font-medium">
              {projectCount.toLocaleString()} Projects Listed
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl md:text-7xl leading-tight">
            Find the right tool for{' '}
            <br className="hidden sm:inline" />
            <span className="shimmer-text">what you&apos;re building.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
            Describe your problem in plain language. Discover high-quality open-source projects tailored to your tech stack and requirements across{' '}
            <span className="font-semibold text-indigo-300">{projectCount.toLocaleString()} listed projects</span>.
          </p>

          {/* Glowing Search Bar Container */}
          <div className="relative mx-auto mt-10 max-w-2xl">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 opacity-30 blur-xl transition-all duration-500 group-hover:opacity-60" />
            <div className="relative">
              <SearchBar large />
            </div>
          </div>

          <TrendingSearches />

          {/* Floating Feature / Stat Cards */}
          <div className="mt-16 grid grid-cols-2 gap-4 text-left sm:grid-cols-3 lg:grid-cols-5">
            <div className="group rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-md transition-all hover:border-indigo-500/40 hover:bg-slate-900/70">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-3 border border-indigo-500/20">
                <FolderGit2 className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Projects Listed</p>
              <p className="mt-1 text-sm font-bold text-white">{projectCount.toLocaleString()} Available</p>
            </div>

            <div className="group rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-md transition-all hover:border-indigo-500/40 hover:bg-slate-900/70">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 mb-3 border border-blue-500/20">
                <Search className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Search Paradigm</p>
              <p className="mt-1 text-sm font-bold text-white">Intent-based Vector</p>
            </div>

            <div className="group rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-md transition-all hover:border-indigo-500/40 hover:bg-slate-900/70">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 mb-3 border border-cyan-500/20">
                <Zap className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Quality Curation</p>
              <p className="mt-1 text-sm font-bold text-white">AI LLM Enriched</p>
            </div>

            <div className="group rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-md transition-all hover:border-indigo-500/40 hover:bg-slate-900/70">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 mb-3 border border-purple-500/20">
                <Database className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ecosystem</p>
              <p className="mt-1 text-sm font-bold text-white">GitHub & GitLab</p>
            </div>

            <div className="col-span-2 sm:col-span-1 group rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-md transition-all hover:border-indigo-500/40 hover:bg-slate-900/70">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-3 border border-emerald-500/20">
                <Shield className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Access</p>
              <p className="mt-1 text-sm font-bold text-white">100% Free & Open</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects Grid with Perspective 3D Tilt */}
      <section className="container relative z-10 py-16">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-indigo-400" />
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">Explore ecosystem</p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-black text-white sm:text-4xl">Featured projects</h2>
              <span className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                {projectCount.toLocaleString()} listed in system
              </span>
            </div>
          </div>
          <Link href="/projects">
            <Button
              variant="ghost"
              className="rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 hover:border-indigo-500/40 hover:bg-slate-800 hover:text-white"
            >
              Browse all {projectCount > 0 ? `${projectCount.toLocaleString()} ` : ''}projects <ArrowRight className="ml-2 h-4 w-4 text-indigo-400" />
            </Button>
          </Link>
        </div>

        {projects.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 p-16 text-center text-slate-400 backdrop-blur-md">
            Projects will appear here once the community starts curating.
          </div>
        )}
      </section>
    </main>
  );
}
