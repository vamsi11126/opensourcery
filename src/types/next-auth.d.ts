import 'next-auth';
declare module 'next-auth' { interface Session { user: { id: string; role: 'USER' | 'MODERATOR' | 'ADMIN'; name?: string | null; email?: string | null; image?: string | null; isNew?: boolean } } interface User { role?: 'USER' | 'MODERATOR' | 'ADMIN'; isNew?: boolean } }
declare module 'next-auth/jwt' { interface JWT { id?: string; role?: 'USER' | 'MODERATOR' | 'ADMIN'; isNew?: boolean } }
