import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Star, ArrowUpRight, Sparkles } from 'lucide-react';
import type { ProjectWithDistance } from '@/lib/vector-search';

export function SimilarProjects({ projects }: { projects: ProjectWithDistance[] }): React.JSX.Element | null {
  if (!projects.length) return null;

  return (
    <section className="mt-12 rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl sm:p-8">
      <div className="flex items-center gap-2 text-indigo-400">
        <Sparkles className="h-5 w-5" />
        <h2 className="text-xl font-bold text-white sm:text-2xl">Similar Open-Source Projects</h2>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Semantically matched open-source alternatives and related repositories.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.slug}`}
            className="group flex flex-col justify-between rounded-2xl border border-slate-800/60 bg-slate-950/60 p-5 transition-all duration-300 hover:border-indigo-500/40 hover:bg-slate-900/80"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {project.title}
                </h3>
                <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-slate-300">
                {project.shortDescription}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-slate-800/40 text-xs">
              <div className="flex items-center gap-2">
                {project.language.slice(0, 1).map((lang) => (
                  <Badge key={lang} className="border-slate-700 bg-slate-900 text-slate-300 text-[10px]">
                    {lang}
                  </Badge>
                ))}
              </div>
              {project.starsCount > 0 && (
                <span className="flex items-center gap-1 font-mono text-amber-400 text-[11px]">
                  <Star className="h-3 w-3 fill-amber-400" />
                  {project.starsCount.toLocaleString()}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
