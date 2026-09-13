import { Skeleton } from '@/components/ui/skeleton';

export default function Loading(): React.JSX.Element {
  return (
    <main className="container py-12">
      <div className="max-w-xl">
        <Skeleton className="h-9 w-48 rounded-xl" />
        <Skeleton className="mt-2 h-4 w-64 rounded-md" />
      </div>
      <div className="mt-8 space-y-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-24 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div>
                <Skeleton className="h-5 w-48 rounded-md" />
                <Skeleton className="mt-2 h-3.5 w-32 rounded-md" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20 rounded-lg" />
              <Skeleton className="h-9 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

