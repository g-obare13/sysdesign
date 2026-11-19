/**
 * @fileoverview Nordic studio workspace loading skeleton.
 * Renders a full-layout skeleton (sidebar, top nav, canvas nodes/edges, and bottom dock)
 * without spinners or inline styles during hydration, project loading, and route transitions.
 */

export default function WorkspaceSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading workspace"
      className="relative flex-1 flex h-full w-full overflow-hidden bg-background select-none"
    >
      {/* Left Floating Sidebar Skeleton */}
      <aside className="fixed top-3 left-3 bottom-3 w-[260px] rounded-xl nordic-panel p-4 hidden sm:flex flex-col gap-3.5 z-40">
        {/* Brand + Collapse */}
        <div className="flex items-center justify-between">
          <div className="h-4 w-20 rounded-md bg-muted animate-pulse" />
          <div className="size-7 rounded-lg bg-muted animate-pulse" />
        </div>

        {/* Project Name + Stats */}
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 rounded-md bg-muted animate-pulse" />
            <div className="size-3.5 rounded bg-muted/70 animate-pulse" />
          </div>
          <div className="h-3 w-24 rounded-md bg-muted/70 animate-pulse" />
        </div>

        {/* Search Pill */}
        <div className="h-9 w-full rounded-full bg-muted/80 animate-pulse" />

        {/* Mode Segmented Switch */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-muted/70">
          <div className="h-7 rounded-full bg-card shadow-xs animate-pulse" />
          <div className="h-7 rounded-full bg-transparent" />
        </div>

        <div className="h-px bg-border/60 my-0.5" />

        {/* Category + Component Item Cards */}
        <div className="space-y-2.5 flex-1 overflow-hidden">
          <div className="flex items-center justify-between px-1">
            <div className="h-3.5 w-24 rounded-md bg-muted animate-pulse" />
            <div className="h-3 w-6 rounded-md bg-muted/70 animate-pulse" />
          </div>

          {[0, 1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-muted/45 border border-border"
            >
              <div className="size-8 rounded-xl bg-muted animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                <div className="h-2.5 w-32 rounded bg-muted/70 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Top-Center Nav Pill Skeleton */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-40 hidden md:flex items-center gap-1 p-1 nordic-panel rounded-full">
        <div className="h-8 w-28 rounded-full bg-card border border-border animate-pulse" />
        <div className="h-8 w-24 rounded-full bg-muted/60 animate-pulse" />
        <div className="h-8 w-24 rounded-full bg-muted/60 animate-pulse" />
        <div className="h-8 w-24 rounded-full bg-muted/60 animate-pulse" />
      </div>

      {/* Top-Right Settings Pill Skeleton */}
      <div className="fixed top-3 right-3 z-40 flex items-center gap-1.5 p-1 nordic-panel rounded-full">
        <div className="size-8 rounded-full bg-muted/80 animate-pulse" />
        <div className="h-3.5 w-14 rounded-md bg-muted/70 hidden sm:block mr-1.5 animate-pulse" />
      </div>

      {/* Right-Middle AI Trigger Skeleton */}
      <div className="fixed right-3 top-1/2 -translate-y-1/2 z-40 hidden sm:block">
        <div className="size-11 rounded-full nordic-panel animate-pulse" />
      </div>

      {/* Center Canvas Diagram Skeleton */}
      <div className="flex-1 flex items-center justify-center sm:pl-[260px]">
        <div className="flex flex-col md:flex-row items-center gap-5 px-6">
          {/* Skeleton Node 1 */}
          <div className="w-48 rounded-2xl nordic-panel overflow-hidden">
            <div className="h-6 px-3 flex items-center justify-between bg-muted/50 border-b border-border/50">
              <div className="h-2.5 w-16 rounded bg-muted animate-pulse" />
              <div className="size-2.5 rounded-full bg-muted animate-pulse" />
            </div>
            <div className="p-3.5 flex items-center gap-3">
              <div className="size-9 rounded-xl bg-muted animate-pulse shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-24 rounded bg-muted animate-pulse" />
                <div className="h-2.5 w-16 rounded bg-muted/70 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Connector Line */}
          <div className="h-6 w-px md:h-px md:w-12 bg-border animate-pulse" />

          {/* Skeleton Node 2 */}
          <div className="w-52 rounded-2xl nordic-panel overflow-hidden">
            <div className="h-6 px-3 flex items-center justify-between bg-muted/50 border-b border-border/50">
              <div className="h-2.5 w-20 rounded bg-muted animate-pulse" />
              <div className="size-2.5 rounded-full bg-muted animate-pulse" />
            </div>
            <div className="p-3.5 flex items-center gap-3">
              <div className="size-9 rounded-xl bg-muted animate-pulse shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-28 rounded bg-muted animate-pulse" />
                <div className="h-2.5 w-20 rounded bg-muted/70 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Connector Line */}
          <div className="h-6 w-px md:h-px md:w-12 bg-border animate-pulse" />

          {/* Skeleton Node 3 */}
          <div className="w-48 rounded-2xl nordic-panel overflow-hidden hidden lg:block">
            <div className="h-6 px-3 flex items-center justify-between bg-muted/50 border-b border-border/50">
              <div className="h-2.5 w-14 rounded bg-muted animate-pulse" />
              <div className="size-2.5 rounded-full bg-muted animate-pulse" />
            </div>
            <div className="p-3.5 flex items-center gap-3">
              <div className="size-9 rounded-xl bg-muted animate-pulse shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-20 rounded bg-muted animate-pulse" />
                <div className="h-2.5 w-16 rounded bg-muted/70 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
