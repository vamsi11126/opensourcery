import { Skeleton } from '@/components/ui/skeleton';

export default function Loading(): React.JSX.Element {
  return (
    <main className="container py-12">
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-8 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <div>
              <Skeleton className="h-8 w-64 rounded-lg" />
              <Skeleton className="mt-2 h-4 w-40 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
        <Skeleton className="mt-6 h-5 w-full rounded-md" />
        <Skeleton className="mt-2 h-5 w-4/5 rounded-md" />
        <div className="mt-8 flex gap-3">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </main>
  );
}

