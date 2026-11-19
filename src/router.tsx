/**
 * @fileoverview TanStack Router configuration and initialization.
 */

import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import WorkspaceSkeleton from "@/components/layout/WorkspaceSkeleton";
import { routeTree } from "./routeTree.gen";

/**
 * Creates and configures the TanStack router instance with route tree and preloading options.
 *
 * @returns Configured TanStack Router instance
 */
export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    defaultPendingComponent: WorkspaceSkeleton,
    defaultPendingMs: 150,
    defaultPendingMinMs: 200,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
