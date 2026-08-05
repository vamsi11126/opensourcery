import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { CollectionManager } from '@/components/CollectionManager';
export const metadata: Metadata = { title: 'Manage collections', description: 'Create and manage your OpenSourcery collections.' };
export default async function ManageCollectionsPage(): Promise<React.JSX.Element> { if (!await auth()) redirect('/login'); return <main className="container py-12"><h1 className="text-4xl font-black">Manage collections</h1><p className="mt-3 text-slate-600">Organize projects into public or private lists for your next build.</p><CollectionManager /></main>; }
