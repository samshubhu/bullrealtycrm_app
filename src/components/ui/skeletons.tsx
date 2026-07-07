import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Shared loading-skeleton primitives                                        */
/*  Mirrors the polished look already used by leads/ and dashboard/ loading.  */
/*  Uses the global `.skeleton` shimmer class (see globals.css).              */
/* -------------------------------------------------------------------------- */

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded", className)} />;
}

/** Slim indeterminate progress bar — the signature "premium" loading accent. */
export function LoadingBar({ className }: { className?: string }) {
  return (
    <div className={cn("h-0.5 overflow-hidden rounded-full bg-[#e8eff6]", className)}>
      <div className="h-full w-1/3 animate-[loading-bar_1.2s_ease-in-out_infinite] bg-brand-500" />
    </div>
  );
}

export function PageHeaderSkeleton({ actions = false }: { actions?: boolean }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3 md:mb-5">
      <div className="space-y-2">
        <SkeletonBlock className="h-6 w-52 md:h-7" />
        <SkeletonBlock className="h-4 w-64" />
      </div>
      {actions && <SkeletonBlock className="h-9 w-32 rounded-lg" />}
    </div>
  );
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2.5">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-7 w-24" />
            </div>
            <SkeletonBlock className="h-9 w-9 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({
  columns = 6,
  rows = 8,
  className,
}: {
  columns?: number;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("card overflow-hidden", className)}>
      <LoadingBar />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <SkeletonBlock className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: columns }).map((_, c) => (
                  <td key={c} className="px-4 py-3.5">
                    {c === 0 ? (
                      <div className="flex items-center gap-2.5">
                        <SkeletonBlock className="h-8 w-8 rounded-full" />
                        <div className="space-y-1.5">
                          <SkeletonBlock className="h-3.5 w-28" />
                          <SkeletonBlock className="h-2.5 w-16" />
                        </div>
                      </div>
                    ) : (
                      <SkeletonBlock className={cn("h-3.5", c % 3 === 0 ? "w-14" : c % 3 === 1 ? "w-24" : "w-20")} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ListSkeleton({
  rows = 6,
  avatar = true,
  className,
}: {
  rows?: number;
  avatar?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("card overflow-hidden", className)}>
      <LoadingBar />
      <div className="divide-y divide-ink-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            {avatar && <SkeletonBlock className="h-9 w-9 shrink-0 rounded-lg" />}
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBlock className="h-3.5 w-1/3" />
              <SkeletonBlock className="h-3 w-2/3" />
            </div>
            <SkeletonBlock className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="skeleton h-24 w-full" />
          <div className="space-y-3 p-4">
            <SkeletonBlock className="h-4 w-2/3" />
            <SkeletonBlock className="h-3 w-1/3" />
            <div className="space-y-2 pt-1">
              <SkeletonBlock className="h-3 w-full" />
              <SkeletonBlock className="h-3 w-4/5" />
            </div>
            <div className="flex items-center justify-between border-t border-ink-100 pt-3">
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="h-3 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChartCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("card overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
        <SkeletonBlock className="h-4 w-36" />
        <SkeletonBlock className="h-6 w-6 rounded" />
      </div>
      <div className="flex h-52 items-end gap-3 p-4">
        {[60, 88, 44, 72, 96, 52, 80].map((h, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div className="skeleton w-full rounded-t" style={{ height: `${h}%` }} />
            <SkeletonBlock className="h-2.5 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}
