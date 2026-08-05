'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

const interests = [
  'Web Frameworks',
  'AI/ML',
  'Dev Tools',
  'Databases',
  'Mobile',
  'Security',
  'Data Visualization',
  'Testing',
  'Languages',
  'Self-hosting',
  'Automation',
  'Documentation',
];

export default function WelcomePage(): React.JSX.Element {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function save(): Promise<void> {
    if (selected.length < 3) {
      setError('Pick at least three interests.');
      return;
    }
    setPending(true);
    const response = await fetch('/api/interests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        interests: selected.map((tag) => ({ tag })),
      }),
    });
    if (response.ok) router.push('/');
    else setError('Could not save your interests.');
    setPending(false);
  }

  return (
    <main className="container flex min-h-[calc(100vh-9rem)] items-center justify-center py-12 text-slate-100">
      <div className="w-full max-w-3xl text-center">
        <p className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-400">
          <Sparkles className="h-4 w-4" />
          Welcome to OpenSourcery
        </p>

        <h1 className="mt-3 text-4xl font-black text-white sm:text-5xl">
          What are you building?
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300">
          Pick a few interests so we can personalize your intent search feed and recommendations.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {interests.map((interest) => {
            const isSelected = selected.includes(interest);
            return (
              <button
                type="button"
                key={interest}
                onClick={() =>
                  setSelected((current) =>
                    current.includes(interest)
                      ? current.filter((item) => item !== interest)
                      : [...current, interest]
                  )
                }
                className={`rounded-2xl border p-4 text-xs font-bold transition-all duration-200 backdrop-blur-md ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-lg shadow-indigo-500/20 scale-[1.03]'
                    : 'border-slate-800/80 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                {interest}
              </button>
            );
          })}
        </div>

        {error && (
          <p role="alert" className="mt-5 text-xs font-semibold text-rose-400">
            {error}
          </p>
        )}

        <div className="mt-8 flex items-center justify-center gap-4">
          <Button disabled={pending} onClick={() => void save()} className="font-bold">
            {pending ? 'Saving…' : 'Continue to catalog'}
          </Button>

          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </main>
  );
}
