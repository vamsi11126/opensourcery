import Link from 'next/link';
import { auth, signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Sparkles, Compass, Bookmark, PlusCircle, ShieldCheck, LayoutDashboard, User } from 'lucide-react';

export async function Navbar(): Promise<React.JSX.Element> {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all duration-300">
      <div className="container flex h-16 items-center justify-between gap-6">
        {/* Brand Logo with Concept 2 logo mark */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-indigo-500/30 bg-slate-900 shadow-lg shadow-indigo-500/20 transition-all duration-300 group-hover:scale-105 group-hover:border-indigo-500/60 group-hover:shadow-indigo-500/40">
            <img src="/logo.jpg" alt="OpenSourcery Logo" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            Open<span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Sourcery</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden items-center gap-1 rounded-full border border-slate-800/60 bg-slate-900/60 p-1 backdrop-blur-md md:flex">
          <Link
            href="/projects"
            className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-slate-300 transition-all duration-200 hover:bg-slate-800 hover:text-white"
          >
            <Compass className="h-3.5 w-3.5 text-blue-400" />
            Browse
          </Link>
          <Link
            href="/collections"
            className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-slate-300 transition-all duration-200 hover:bg-slate-800 hover:text-white"
          >
            <Bookmark className="h-3.5 w-3.5 text-indigo-400" />
            Collections
          </Link>
          {session && (
            <Link
              href="/submit"
              className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-slate-300 transition-all duration-200 hover:bg-slate-800 hover:text-white"
            >
              <PlusCircle className="h-3.5 w-3.5 text-cyan-400" />
              Submit
            </Link>
          )}
          {session?.user.role !== 'USER' && session && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-slate-300 transition-all duration-200 hover:bg-slate-800 hover:text-white"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Admin
            </Link>
          )}
        </nav>

        {/* Right Actions / Auth buttons */}
        <div className="flex items-center gap-3">
          {session ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="hidden items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition-all duration-200 hover:border-slate-700 hover:bg-slate-800 md:flex"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-indigo-400" />
                Dashboard
              </Link>
              <Link
                href={`/profile/${session.user.id}`}
                className="hidden items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition-all duration-200 hover:border-slate-700 hover:bg-slate-800 md:flex"
              >
                <User className="h-3.5 w-3.5 text-blue-400" />
                Profile
              </Link>
              <form
                action={async () => {
                  'use server';
                  await signOut({ redirectTo: '/' });
                }}
              >
                <Button
                  type="submit"
                  variant="outline"
                  className="rounded-xl border-slate-800 bg-slate-900/60 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white"
                >
                  Sign out
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-900 hover:text-white"
                >
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button className="rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all duration-300 hover:scale-[1.03] hover:shadow-indigo-600/50">
                  Get started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
