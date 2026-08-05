import Link from 'next/link';
import { Star, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatStars } from '@/lib/utils';
import { TiltCard } from '@/components/3d/TiltCard';

export interface ProjectCardData {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  tags: string[];
  language: string[];
  license: string | null;
  starsCount: number;
}

export function ProjectCard({ project }: { project: ProjectCardData }): React.JSX.Element {
  return (
    <Link href={`/projects/${project.slug}`} className="block h-full">
      <TiltCard
        maxTilt={10}
        scale={1.02}
        glare={true}
        className="group relative h-full overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10"
      >
        {/* Top ambient highlight gradient */}
        <div className="pointer-events-none absolute -left-12 -top-12 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
        
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div>
            {/* Header: 3D Tile Avatar & Star Pill */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 via-slate-800 to-slate-900 p-0.5 shadow-md shadow-indigo-500/10 border border-slate-700/60 transition-transform duration-300 group-hover:scale-110 group-hover:border-indigo-400/40">
                <span className="text-lg font-black bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                  {project.title.slice(0, 1).toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-xs font-semibold text-slate-300 backdrop-blur-md shadow-inner">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{formatStars(project.starsCount)}</span>
              </div>
            </div>

            {/* Title & Description */}
            <h3 className="text-lg font-bold text-white transition-colors duration-200 group-hover:text-indigo-300 flex items-center justify-between">
              {project.title}
              <Sparkles className="h-4 w-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-indigo-400" />
            </h3>
            
            <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-relaxed text-slate-400">
              {project.shortDescription}
            </p>
          </div>

          {/* Badges / Tech tags */}
          <div className="mt-6 flex flex-wrap gap-1.5 pt-2">
            {project.language.slice(0, 1).map((item) => (
              <Badge
                key={item}
                className="border-indigo-500/30 bg-indigo-500/10 text-xs font-medium text-indigo-300 backdrop-blur-sm"
              >
                {item}
              </Badge>
            ))}
            {project.license && (
              <Badge
                className="border border-slate-800 bg-slate-900/50 text-xs text-slate-400"
              >
                {project.license}
              </Badge>
            )}
            {project.tags.slice(0, 2).map((item) => (
              <Badge
                key={item}
                className="border border-slate-800/80 bg-slate-900/30 text-xs text-slate-400"
              >
                #{item}
              </Badge>
            ))}
          </div>
        </div>
      </TiltCard>
    </Link>
  );
}
