import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { useLocation } from "@tanstack/react-router";
import { IconHome, IconLinkOff } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

import appCss from "../globals.css?url";
import Toolbar from "../components/toolbar/Toolbar";
import Footer from "../components/layout/Footer";
import MobileBlock from "../components/layout/MobileBlock";
import { useCanvasStore } from "../store/canvas.store";

/**
 * The root route configuration for the entire application.
 * Defines the base HTML structure, meta tags, and global layout providers.
 */
export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SysDesign - Professional Systems Architecture Tool" },
      {
        name: "description",
        content:
          "The most powerful way to visualize and design your system architectures. Cloud-native components, real-time collaboration, and professional layouts.",
      },
      {
        name: "keywords",
        content:
          "system design, architecture diagrams, cloud infra, AWS, GCP, Azure, microservices, diagramming tool",
      },
      {
        name: "og:title",
        content: "SysDesign - Professional Systems Architecture Tool",
      },
      {
        name: "og:description",
        content:
          "Visualize your entire backend, cloud, and microservice architectures with ease. Professional-grade diagramming for high-scale teams.",
      },
      { name: "og:type", content: "website" },
      {
        name: "og:image",
        content:
          "https://pprstys1m6xjtdrw.public.blob.vercel-storage.com/og-image.png",
      },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "SysDesign - Systems Design Visualizer",
      },
      {
        name: "twitter:description",
        content:
          "Visualize your entire backend, cloud, and microservice architectures with ease.",
      },
      { name: "theme-color", content: "#c57642" },
      { name: "robots", content: "index, follow" },
    ],

    links: [
      { rel: "preload", href: "/fonts/MonaSans.woff2", as: "font", type: "font/woff2", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Host+Grotesk:ital,wght@0,300..800;1,300..800&display=swap",
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
});

/**
 * The base document structure for the application.
 * Wraps all routes with necessary providers (theme, tooltips) and core layout (Toolbar, Footer).
 */
function RootDocument({ children }: { children: React.ReactNode }) {
  const isExporting = useCanvasStore((s) => s.isExporting);
  const location = useLocation();

  // Marketing/content routes keep the footer; the canvas editor hides it to
  // maximize vertical space. Mirrors the toolbar's canvas-route detection.
  const contentRoutes = [
    "/projects",
    "/templates",
    "/privacy",
    "/terms",
    "/integrations",
    "/flows",
    "/shapes",
  ];
  const isCanvasRoute =
    location.pathname === "/" || !contentRoutes.includes(location.pathname);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="relative" suppressHydrationWarning>
        <ThemeProvider>
          <TooltipProvider delay={300}>
            {/* The editor needs a desktop; content pages stay readable on mobile */}
            {isCanvasRoute && <MobileBlock />}
            <ReactFlowProvider>
              <div className="flex flex-col h-screen overflow-hidden bg-background">
                {!isExporting && <Toolbar />}
                <div className="flex-1 flex overflow-y-auto relative">
                  {children}
                </div>
                {!isExporting && !isCanvasRoute && <Footer />}
              </div>
            </ReactFlowProvider>
          </TooltipProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
/**
 * Professional Not Found (404) view.
 * Styled to match the SysDesign professional aesthetic.
 */
function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="relative mb-8">
        <div className="size-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary rotate-12 animate-bounce duration-2000">
          <IconLinkOff size={48} stroke={1.5} />
        </div>
        <div className="absolute -bottom-2 -right-2 size-10 rounded-2xl bg-background border border-border flex items-center justify-center shadow-lg">
          <span className="text-sm font-black tracking-tighter">404</span>
        </div>
      </div>

      <h1 className="font-display text-4xl font-bold tracking-tight mb-3 bg-linear-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
        Lost in the Cloud?
      </h1>
      <p className="max-w-md mx-auto text-muted-foreground mb-10 leading-relaxed font-medium">
        The route you're looking for doesn't exist in our architecture registry.
        It might have been renamed or moved to a different region.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button
          href="/"
          variant="default"
          size="lg"
          className="rounded-lg gap-2 h-12 px-8 min-w-[160px]"
        >
          <IconHome size={18} />
          Go to Editor
        </Button>
        <Button
          href="/projects"
          variant="secondary"
          size="lg"
          className="rounded-lg h-12 px-8 border-border/40"
        >
          My Projects
        </Button>
      </div>

      <div className="mt-16 pt-8 border-t border-border/20 w-full max-w-xs opacity-40">
        <div className="text-[10px] font-bold tracking-widest uppercase">
          SysDesign Internal Error Registry
        </div>
      </div>
    </main>
  );
}
