/**
 * @fileoverview Root route layout and HTML document structure for the application.
 */

import { HeadContent, Scripts, createRootRoute, useLocation  } from "@tanstack/react-router";
import { IconHome, IconLinkOff } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { initConsole } from "@/lib/console";

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

import appCss from "@/globals.css?url";
import Toolbar from "@/components/toolbar/Toolbar";
import Footer from "@/components/layout/Footer";
import MobileBlock from "@/components/layout/MobileBlock";
import { useCanvasStore } from "@/store/canvas.store";

initConsole();

/**
 * The root route configuration for the entire application.
 * Defines the base HTML structure, meta tags, and global layout providers.
 */
export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SysDesign — Systems Architecture & C4 Modeling" },
      {
        name: "description",
        content:
          "Professional system architecture and C4 diagramming tool with cloud-native components, keyboard navigation, and export support.",
      },
      {
        name: "keywords",
        content:
          "system design, architecture diagrams, cloud infra, AWS, GCP, Azure, microservices, C4 model, diagramming tool",
      },
      {
        name: "og:title",
        content: "SysDesign — Systems Architecture & C4 Modeling",
      },
      {
        name: "og:description",
        content:
          "Visualize distributed systems and microservice architectures with ease.",
      },
      { name: "og:type", content: "website" },
      { name: "theme-color", content: "#59634b" },
      { name: "robots", content: "index, follow" },
    ],

    links: [
      {
        rel: "preload",
        href: "/fonts/texgyreheros-regular.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/texgyreheros-bold.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      { rel: "stylesheet", href: appCss },
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
      <body className="relative font-sans text-foreground bg-background antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <TooltipProvider delay={300}>
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
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
      <div className="size-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-xs">
        <IconLinkOff size={22} stroke={1.5} />
      </div>

      <span className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-widest mb-1">
        404 · Route Not Found
      </span>
      <h1 className="text-xl font-semibold text-foreground mb-2">
        Page Not Found
      </h1>
      <p className="max-w-sm mx-auto text-xs text-muted-foreground mb-6 leading-relaxed">
        The route you requested does not exist in the architecture registry or has been relocated.
      </p>

      <div className="flex items-center gap-2">
        <Button
          href="/"
          variant="default"
          size="sm"
          className="gap-1.5"
        >
          <IconHome size={14} />
          Editor
        </Button>
        <Button
          href="/projects"
          variant="outline"
          size="sm"
        >
          Projects
        </Button>
      </div>
    </main>
  );
}
