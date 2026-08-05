import { db } from '@/lib/db';

export interface CuratorTier {
  name: string;
  badge: string;
  color: string;
  minScore: number;
}

export const CURATOR_TIERS: CuratorTier[] = [
  { name: 'Legendary Contributor', badge: '💎', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10', minScore: 1000 },
  { name: 'Master Curator', badge: '🥇', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10', minScore: 250 },
  { name: 'Pro Curator', badge: '🥈', color: 'text-slate-200 border-slate-400/30 bg-slate-400/10', minScore: 50 },
  { name: 'Novice Curator', badge: '🥉', color: 'text-amber-600 border-amber-700/30 bg-amber-700/10', minScore: 0 },
];

export function getCuratorTier(score: number): CuratorTier {
  return CURATOR_TIERS.find((tier) => score >= tier.minScore) ?? CURATOR_TIERS[CURATOR_TIERS.length - 1];
}

/** Award karma points to a user and update their leaderboard rank and tier. */
export async function awardKarma(userId: string, points: number): Promise<number> {
  try {
    const user = await db.user.update({
      where: { id: userId },
      data: {
        reputation: { increment: points },
      },
      select: { id: true, reputation: true },
    });

    await db.leaderboardEntry.upsert({
      where: { userId },
      update: { score: user.reputation },
      create: { userId, score: user.reputation },
    });

    return user.reputation;
  } catch {
    return 0;
  }
}
