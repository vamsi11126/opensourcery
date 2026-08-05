'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus } from 'lucide-react';

export default function RegisterPage(): React.JSX.Element {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setPending(true);
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) setError(result.error ?? 'Could not create account.');
    else router.push('/login');
    setPending(false);
  }

  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-8 backdrop-blur-xl shadow-2xl text-slate-100">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Create an account
          </h1>
          <p className="mt-1.5 text-xs text-slate-400">
            Join the community curating better open-source software.
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <UserPlus className="h-5 w-5" />
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="text-xs font-semibold text-rose-400">
            {error}
          </p>
        )}
        <div>
          <label
            htmlFor="name"
            className="mb-1.5 block text-xs font-semibold text-slate-300 uppercase tracking-wider"
          >
            Full Name
          </label>
          <Input id="name" name="name" required placeholder="Ada Lovelace" />
        </div>
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-xs font-semibold text-slate-300 uppercase tracking-wider"
          >
            Email Address
          </label>
          <Input id="email" name="email" type="email" required placeholder="ada@example.com" />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-semibold text-slate-300 uppercase tracking-wider"
          >
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            minLength={8}
            required
            placeholder="At least 8 characters"
          />
        </div>
        <Button className="w-full font-bold mt-2" disabled={pending}>
          {pending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">
        Already registered?{' '}
        <Link href="/login" className="font-bold text-indigo-400 hover:text-indigo-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}
