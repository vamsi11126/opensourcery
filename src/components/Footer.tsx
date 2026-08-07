import Link from 'next/link';
import { Sparkles, Github, Heart } from 'lucide-react';

export function Footer(): React.JSX.Element {
  return (
    <footer className="relative mt-32 overflow-hidden border-t border-slate-800/80 bg-slate-950 text-slate-400">
      {/* Background ambient lighting glow */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-64 w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-600/10 via-purple-600/10 to-cyan-500/10 blur-3xl opacity-70" />

      <div className="container py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg border border-indigo-500/30 bg-slate-900 shadow-md">
                <img src="/logo.jpg" alt="OpenSourcery Logo" className="h-full w-full object-cover" />
              </div>
              <span className="text-lg font-black text-white">
                Open<span className="text-indigo-400">Sourcery</span>
              </span>
            </Link>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-slate-400">
              The discovery-first catalog for open-source tools & frameworks. Search by intent, powered by intent-based semantic search.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-300">
            <Link href="/projects" className="transition-colors hover:text-indigo-400">
              Explore Catalog
            </Link>
            <Link href="/collections" className="transition-colors hover:text-indigo-400">
              Collections
            </Link>
            <Link href="/submit" className="transition-colors hover:text-indigo-400">
              Submit Project
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-slate-200 backdrop-blur-md transition-all hover:border-slate-700 hover:text-white"
            >
              <Github className="h-3.5 w-3.5 text-indigo-400" />
              GitHub
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-900 pt-6 text-xs text-slate-500 sm:flex-row">
          <span>&copy; {new Date().getFullYear()} OpenSourcery. Built for the open web.</span>
          <span className="flex items-center gap-1">
            Crafted with <Heart className="h-3 w-3 fill-rose-500 text-rose-500" /> for developers worldwide
          </span>
        </div>
      </div>
    </footer>
  );
}
