import type { Metadata } from 'next';
import { Trophy } from 'lucide-react';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Leaderboard - OpenSourcery',
  description: 'The most helpful contributors in the OpenSourcery community.',
};

export const revalidate = 300;

function badge(score: number): string | null {
  return score >= 1000
    ? 'Platinum'
    : score >= 500
    ? 'Gold'
    : score >= 200
    ? 'Silver'
    : score >= 50
    ? 'Bronze'
    : null;
}

export default async function LeaderboardPage(): Promise<React.JSX.Element> {
  const session = await auth();
  const users = await db.user.findMany({
    orderBy: { reputation: 'desc' },
    take: 50,
    select: {
      id: true,
      name: true,
      image: true,
      reputation: true,
      _count: { select: { savedProjects: true } },
      submittedProjects: {
        where: { status: 'APPROVED' },
        select: { id: true },
      },
    },
  });

  return (
    <main className="container min-h-screen py-12 text-slate-100">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Trophy className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-white sm:text-5xl">
            Leaderboard
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Recognizing the contributors making open-source tools easier to discover.
          </p>
        </div>
      </div>

      <div className="mt-10 overflow-x-auto rounded-3xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
        <table className="w-full min-w-[620px] text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="p-4">Rank</th>
              <th className="p-4">Contributor</th>
              <th className="p-4">Reputation</th>
              <th className="p-4">Approved Submissions</th>
              <th className="p-4">Bookmarks Given</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {users.map((user, index) => {
              const isCurrentUser = session?.user.id === user.id;
              return (
                <tr
                  key={user.id}
                  className={`transition-colors hover:bg-slate-900/40 ${
                    isCurrentUser ? 'bg-indigo-500/10' : ''
                  }`}
                >
                  <td className="p-4 font-bold text-amber-400">
                    #{index + 1}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 font-bold text-white text-xs border border-slate-700">
                        {user.name?.slice(0, 1).toUpperCase() ?? '?'}
                      </div>
                      <span className="font-bold text-white">
                        {user.name ?? 'Community member'}
                      </span>
                      {badge(user.reputation) && (
                        <Badge className="border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
                          {badge(user.reputation)}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-indigo-300">
                    {user.reputation}
                  </td>
                  <td className="p-4 text-slate-200">
                    {user.submittedProjects.length}
                  </td>
                  <td className="p-4 text-slate-200">
                    {user._count.savedProjects}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
