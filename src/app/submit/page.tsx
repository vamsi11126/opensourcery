import type { Metadata } from 'next';
import { SubmitForm } from '@/components/SubmitForm';

export const metadata: Metadata = {
  title: 'Submit a Project - OpenSourcery',
  description: 'Submit an open-source project for community curation and indexing.',
};

export default function SubmitPage(): React.JSX.Element {
  return (
    <main className="container min-h-screen py-12 text-slate-100">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">
          Community Curation
        </p>
        <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">
          Submit a project
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          Share a repository or tool you believe builders should know about. Every submission is reviewed.
        </p>

        <div className="mt-8 rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl shadow-2xl sm:p-8">
          <SubmitForm />
        </div>
      </div>
    </main>
  );
}
