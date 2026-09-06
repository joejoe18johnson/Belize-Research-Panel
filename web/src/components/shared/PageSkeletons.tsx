import { AUTH_CONTENT_MAX, appContentFrameClass, pageRootClass } from "@/lib/layout-widths";
import {
  Skeleton,
  SkeletonCard,
  SkeletonField,
  SkeletonText,
  Stagger,
} from "@/components/shared/Skeleton";

/** Auth pages (login, signup, forgot password, etc.) */
export function AuthPageSkeleton() {
  return (
    <div
      className={`${pageRootClass} flex flex-col bg-[linear-gradient(180deg,#f0fdfa_0%,#f4f4f5_14rem,#f4f4f5_100%)] dark:bg-[linear-gradient(180deg,#042f2e_0%,#09090b_14rem,#09090b_100%)]`}
    >
      <header className="border-b border-teal-100/80 bg-white/80 backdrop-blur dark:border-teal-900/40 dark:bg-zinc-950/80">
        <div className={`mx-auto ${AUTH_CONTENT_MAX} px-3 py-3 sm:px-4 sm:py-4`}>
          <Stagger className="flex items-center justify-between">
            <Skeleton className="h-8 w-40" rounded="md" />
            <Skeleton className="h-9 w-9" rounded="full" />
          </Stagger>
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-3 py-8 sm:items-center sm:px-4 sm:py-16">
        <div className={`w-full ${AUTH_CONTENT_MAX}`}>
          <SkeletonCard>
            <Stagger className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-full max-w-sm" />
              </div>
              <Skeleton className="h-12 w-full" rounded="xl" />
              <Skeleton className="mx-auto h-3 w-28" />
              <SkeletonField />
              <SkeletonField />
              <Skeleton className="h-12 w-full" rounded="xl" />
              <Skeleton className="mx-auto h-3.5 w-40" />
            </Stagger>
          </SkeletonCard>
        </div>
      </main>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** Dashboard content area (shell already mounted from layout). */
export function DashboardContentSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Stagger className="space-y-3">
        <Skeleton className="h-3 w-36" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11" rounded="xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
      </Stagger>

      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" startIndex={4}>
        {Array.from({ length: 3 }, (_, i) => (
          <SkeletonCard key={i} className="p-4 sm:p-5">
            <Stagger className="space-y-3" startIndex={4 + i * 3}>
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-full" />
            </Stagger>
          </SkeletonCard>
        ))}
      </Stagger>

      <SkeletonCard>
        <Stagger className="space-y-4" startIndex={14}>
          <Skeleton className="h-5 w-44" />
          <SkeletonText lines={4} startIndex={15} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-24 w-full" rounded="xl" />
            <Skeleton className="h-24 w-full" rounded="xl" />
          </div>
        </Stagger>
      </SkeletonCard>
      <span className="sr-only">Loading dashboard…</span>
    </div>
  );
}

/** Full dashboard route while layout + page resolve. */
export function DashboardPageSkeleton() {
  return (
    <div className={`${pageRootClass} w-full max-w-full overflow-x-clip bg-zinc-50 dark:bg-zinc-950`}>
      <header className="border-b border-teal-100 bg-white dark:border-teal-900/40 dark:bg-zinc-900">
        <div className={`${appContentFrameClass} py-2.5 sm:py-3`}>
          <Stagger className="flex items-center justify-between gap-3">
            <Skeleton className="h-8 w-44" rounded="md" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-16" rounded="lg" />
              <Skeleton className="h-10 w-10" rounded="full" />
              <Skeleton className="h-10 w-10" rounded="full" />
            </div>
          </Stagger>
        </div>
        <div className={`${appContentFrameClass} pb-3`}>
          <Stagger className="flex gap-2 overflow-hidden" startIndex={4}>
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-24 shrink-0" rounded="lg" />
            ))}
          </Stagger>
        </div>
      </header>
      <main className={`${appContentFrameClass} py-5 sm:py-8`}>
        <DashboardContentSkeleton />
      </main>
    </div>
  );
}

/** Admin console content. */
export function AdminContentSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Stagger className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </Stagger>

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" startIndex={3}>
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonCard key={i} className="p-4">
            <Stagger className="space-y-3" startIndex={3 + i * 3}>
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-3 w-full" />
            </Stagger>
          </SkeletonCard>
        ))}
      </Stagger>

      <SkeletonCard>
        <Stagger className="space-y-4" startIndex={16}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-32" rounded="lg" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-14 w-full" rounded="xl" />
            ))}
          </div>
        </Stagger>
      </SkeletonCard>
      <span className="sr-only">Loading admin…</span>
    </div>
  );
}

export function AdminPageSkeleton() {
  return (
    <div className={`${pageRootClass} bg-zinc-50 dark:bg-zinc-950`}>
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:block">
          <Stagger className="space-y-3">
            <Skeleton className="h-8 w-36" />
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" rounded="lg" />
            ))}
          </Stagger>
        </aside>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <AdminContentSkeleton />
        </main>
      </div>
    </div>
  );
}

/** Marketing / home page. */
export function HomePageSkeleton() {
  return (
    <div className={`${pageRootClass} bg-zinc-50 dark:bg-zinc-950`} aria-busy="true">
      <header className="border-b border-teal-100/80 bg-white/90 dark:border-teal-900/40 dark:bg-zinc-950/90">
        <div className={`${appContentFrameClass} flex items-center justify-between py-3`}>
          <Stagger className="flex w-full items-center justify-between gap-3">
            <Skeleton className="h-8 w-44" rounded="md" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-20" rounded="lg" />
              <Skeleton className="h-10 w-24" rounded="lg" />
            </div>
          </Stagger>
        </div>
      </header>
      <main>
        <section className={`${appContentFrameClass} py-10 sm:py-16`}>
          <Stagger className="mx-auto max-w-2xl space-y-5 text-center">
            <Skeleton className="mx-auto h-4 w-48" />
            <Skeleton className="mx-auto h-10 w-full max-w-lg" />
            <Skeleton className="mx-auto h-4 w-full max-w-md" />
            <Skeleton className="mx-auto h-4 w-[75%] max-w-sm" />
            <div className="flex justify-center gap-3 pt-2">
              <Skeleton className="h-12 w-40" rounded="xl" />
              <Skeleton className="h-12 w-32" rounded="xl" />
            </div>
          </Stagger>
        </section>
        <section className={`${appContentFrameClass} pb-16`}>
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" startIndex={8}>
            {Array.from({ length: 4 }, (_, i) => (
              <SkeletonCard key={i}>
                <Stagger className="space-y-3" startIndex={8 + i * 3}>
                  <Skeleton className="h-5 w-28" />
                  <SkeletonText lines={3} />
                </Stagger>
              </SkeletonCard>
            ))}
          </Stagger>
        </section>
      </main>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** Compact inline block for Suspense / client fetch states. */
export function InlinePanelSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <SkeletonCard>
      <Stagger className="space-y-3">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" rounded="xl" />
        ))}
      </Stagger>
      <span className="sr-only">Loading…</span>
    </SkeletonCard>
  );
}
