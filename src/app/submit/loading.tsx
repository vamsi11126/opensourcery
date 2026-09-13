import { Skeleton } from '@/components/ui/skeleton';

export default function Loading(): React.JSX.Element {
  return (
    <main className="container max-w-2xl py-12">
      <Skeleton className="h-9 w-48 rounded-xl" />
      <Skeleton className="mt-2 h-4 w-72 rounded-md" />
      <div className="mt-8 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl space-y-6">
        <div>
          <Skeleton className="h-4 w-24 rounded-md mb-2" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <div>
          <Skeleton className="h-4 w-20 rounded-md mb-2" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <div>
          <Skeleton className="h-4 w-32 rounded-md mb-2" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
        <Skeleton className="h-11 w-32 rounded-xl" />
      </div>
    </main>
  );
}

