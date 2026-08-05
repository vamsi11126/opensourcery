export type AppUserRole = 'USER' | 'MODERATOR' | 'ADMIN';

export function canManageProject(user: { id?: string | null; role?: AppUserRole | string | null } | null | undefined, ownerId?: string | null): boolean {
  if (!user?.id) return false;
  if (user.role === 'ADMIN' || user.role === 'MODERATOR') return true;
  return Boolean(ownerId && ownerId === user.id);
}
