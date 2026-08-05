'use client';

import Link from 'next/link';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogIn } from 'lucide-react';

export default function LoginPage(): React.JSX.Element {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function oauth(provider: 'github' | 'google'): Promise<void> {
    setPending(true);
    setError('');
    try {
      await signIn(provider, { callbackUrl: '/' });
    } catch {
      setError(`Unable to authenticate with ${provider}.`);
      setPending(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setPending(true);
    setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
      callbackUrl: '/dashboard',
    });
    if (result?.error) {
      setError(
        result.error === 'CredentialsSignin'
          ? 'Invalid email or password.'
          : 'The database is temporarily unavailable. Please try again shortly.'
      );
      setPending(false);
    } else {
      window.location.href = '/dashboard';
    }
  }

  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-8 backdrop-blur-xl shadow-2xl text-slate-100">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Welcome back
          </h1>
          <p className="mt-1.5 text-xs text-slate-400">
            Sign in to save projects, create collections, and join the open community.
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <LogIn className="h-5 w-5" />
        </div>
      </div>

      {/* OAuth Sign-In Buttons */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => void oauth('github')}
          className="w-full justify-center gap-2 border-slate-800 bg-slate-950/80 hover:border-indigo-500/40 hover:bg-slate-900"
        >
          <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span>Continue with GitHub</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => void oauth('google')}
          className="w-full justify-center gap-2 border-slate-800 bg-slate-950/80 hover:border-indigo-500/40 hover:bg-slate-900"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9c-.7-.7-1.3-1.6-1.6-2.6z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
            />
          </svg>
          <span>Continue with Google</span>
        </Button>
      </div>

      <div className="my-6 flex items-center gap-3 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
        <span className="h-px flex-1 bg-slate-800" />
        OR
        <span className="h-px flex-1 bg-slate-800" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="text-xs font-semibold text-rose-400">
            {error}
          </p>
        )}
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-xs font-semibold text-slate-300 uppercase tracking-wider"
          >
            Email address
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
          />
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
            required
            placeholder="••••••••"
          />
        </div>
        <Button className="w-full font-bold mt-2" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in with email'}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">
        New here?{' '}
        <Link
          href="/register"
          className="font-bold text-indigo-400 hover:text-indigo-300"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
