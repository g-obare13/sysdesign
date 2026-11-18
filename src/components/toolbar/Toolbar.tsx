/**
 * @fileoverview Floating Nordic studio chrome: top-center navigation pill,
 * top-right settings cluster, C4 level switcher, and bottom canvas control docks.
 */

import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useReactFlow, useViewport } from "@xyflow/react";
import { useState } from "react";

import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBrain,
  IconChevronDown,
  IconClick,
  IconFocus2,
  IconGridDots,
  IconInfoCircle,
  IconKey,
  IconKeyboard,
  IconLogout,
  IconMouse,
  IconSettings,
  IconSitemap,
  IconTrash,
  IconUserCircle,
  IconX,
  IconZoomIn,
  IconZoomOut,
} from "@tabler/icons-react";
import type { Template } from "@/data/templates";
import {
  autoLayout,
  clearCanvas,
  loadTemplate,
  redo,
  setC4Level,
  setDiagramMode,
  setExportingState,
  toggleSnap,
  undo,
  useCanvasStore,
} from "@/store/canvas.store";
import type { C4Level } from "@/types/diagram";
import { login, logout, useProjectStore } from "@/store/project.store";
import {
  exportMermaid,
  exportPng,
  exportStructurizr,
  exportSvgFile,
  exportTerraform,
} from "@/components/export/exportUtils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import AISettings from "@/components/ai/AISettings";
import AIFloatingButton from "@/components/ai/AIFloatingButton";
import AIChatDrawer from "@/components/ai/AIChatDrawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const EXPORT_OPTIONS = [
  { key: "png", label: "PNG image", desc: "Raster, 2× resolution" },
  { key: "svg", label: "SVG image", desc: "Vector, infinitely scalable" },
  { key: "mermaid", label: "Mermaid", desc: "Diagram-as-code (.mmd)" },
  { key: "terraform", label: "Terraform", desc: "HCL scaffold (main.tf)" },
  { key: "dsl", label: "Structurizr", desc: "C4 architecture (.dsl)" },
];

const C4_LEVELS: Array<{ id: C4Level; label: string; tooltip: string }> = [
  {
    id: "context",
    label: "L1 · Context",
    tooltip: "User personas, system boundaries & external systems",
  },
  {
    id: "container",
    label: "L2 · Containers",
    tooltip: "Deployable apps, APIs, databases & queues",
  },
  {
    id: "component",
    label: "L3 · Components",
    tooltip: "Internal services, controllers & data access modules",
  },
  {
    id: "code",
    label: "L4 · Code",
    tooltip: "Class structures, interfaces & domain models",
  },
];

const TOP_NAV_ITEMS = [
  { id: "components", label: "Architecture", path: "/$slug" },
  { id: "c4", label: "C4 Model", path: "/$slug/c4" },
  { id: "templates", label: "Templates", path: "/templates" },
  { id: "integrations", label: "Integrations", path: "/integrations" },
  { id: "flows", label: "Flows", path: "/flows" },
  { id: "shapes", label: "Shapes", path: "/shapes" },
];

/**
 * Floating global navigation, settings cluster, and canvas control docks.
 */
export default function Toolbar() {
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const activeProject = projects.find((p) => p.id === activeProjectId);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const snapToGrid = useCanvasStore((s) => s.snapToGrid);
  const historyIndex = useCanvasStore((s) => s.historyIndex);
  const historyLen = useCanvasStore((s) => s.history.length);
  const isExporting = useCanvasStore((s) => s.isExporting);
  const diagramMode = useCanvasStore((s) => s.diagramMode);
  const c4Level = useCanvasStore((s) => s.c4Level);

  const user = useProjectStore((s) => s.user);
  const loading = useProjectStore((s) => s.loading);
  const migrating = useProjectStore((s) => s.migrating);

  const location = useLocation();
  const navigate = useNavigate();
  const { zoomIn, zoomOut, zoomTo, fitView } = useReactFlow();
  const { zoom } = useViewport();

  const [aiSettingsOpen, setAiSettingsOpen] = useState(false);
  const [templateConfirm, setTemplateConfirm] = useState<Template | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [showHint, setShowHint] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hide-canvas-hint") !== "true";
    }
    return false;
  });

  const toggleHint = () => {
    const newState = !showHint;
    setShowHint(newState);
    if (newState === false) {
      localStorage.setItem("hide-canvas-hint", "true");
    } else {
      localStorage.removeItem("hide-canvas-hint");
    }
  };

  const isCanvasRoute =
    location.pathname === "/" ||
    (![
      "/projects",
      "/templates",
      "/privacy",
      "/terms",
      "/integrations",
      "/flows",
      "/shapes",
    ].includes(location.pathname) &&
      !location.pathname.includes("."));

  const currentPath = location.pathname;
  let activeNavTab = "components";
  if (currentPath === "/integrations") activeNavTab = "integrations";
  else if (currentPath === "/flows") activeNavTab = "flows";
  else if (currentPath === "/shapes") activeNavTab = "shapes";
  else if (currentPath === "/templates") activeNavTab = "templates";
  else if (currentPath === "/projects") activeNavTab = "projects";
  else if (currentPath.endsWith("/c4")) activeNavTab = "c4";

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyLen - 1;
  const hasNodes = nodes.length > 0;

  const handleLoadTemplate = (tpl: Template) => {
    loadTemplate(tpl);
    setTemplateConfirm(null);
  };

  const handleExport = async (key: string) => {
    setExportingState(true);
    await new Promise((r) => setTimeout(r, 100));

    try {
      if (key === "png") await exportPng();
      else if (key === "svg") await exportSvgFile();
      else if (key === "mermaid") exportMermaid(nodes, edges);
      else if (key === "terraform") exportTerraform(nodes, edges);
      else if (key === "dsl") exportStructurizr(nodes, edges);
    } finally {
      setExportingState(false);
    }
  };

  const handleNavClick = (item: (typeof TOP_NAV_ITEMS)[0]) => {
    if (
      item.id === "integrations" ||
      item.id === "flows" ||
      item.id === "shapes" ||
      item.id === "templates"
    ) {
      navigate({ to: item.path as any });
      return;
    }

    if (item.id === "c4") {
      setDiagramMode("c4");
      if (activeProject) {
        navigate({
          to: "/$slug/c4",
          params: { slug: activeProject.slug } as any,
        });
      } else {
        navigate({ to: "/" });
      }
    } else if (item.id === "components") {
      setDiagramMode("architecture");
      if (activeProject) {
        navigate({ to: "/$slug", params: { slug: activeProject.slug } as any });
      } else {
        navigate({ to: "/" });
      }
    }
  };

  if (isExporting) return null;

  return (
    <>
      <ConfirmModal
        open={!!templateConfirm}
        title="Load Architecture Template?"
        description={`This will clear your current canvas and load the "${templateConfirm?.name}" design. This action cannot be undone.`}
        confirmText="Load Template"
        onClose={() => setTemplateConfirm(null)}
        onConfirm={() => handleLoadTemplate(templateConfirm!)}
      />

      <ConfirmModal
        open={clearConfirmOpen}
        title="Clear Canvas?"
        description="This will remove all nodes and edges from your design. This action can be undone with the undo button."
        confirmText="Clear Canvas"
        onClose={() => setClearConfirmOpen(false)}
        onConfirm={() => {
          clearCanvas();
          setClearConfirmOpen(false);
        }}
      />

      {/* AI Key Settings Dialog */}
      {aiSettingsOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setAiSettingsOpen(false)}
          />
          <div className="relative w-full max-w-md nordic-panel rounded-[20px] animate-in zoom-in-98 duration-150 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-muted flex items-center justify-center text-foreground">
                  <IconKey size={14} stroke={1.6} />
                </div>
                <h6 className="text-sm font-semibold text-foreground">
                  AI Provider Keys
                </h6>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                icon={<IconX size={15} />}
                onClick={() => setAiSettingsOpen(false)}
                className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              />
            </div>
            <AISettings />
          </div>
        </div>
      )}

      {/* Non-canvas Top-Left Floating Brand Pill (only on pages without Sidebar) */}
      {["/projects", "/templates", "/privacy", "/terms"].includes(
        location.pathname,
      ) && (
        <Link
          to="/"
          className="fixed top-3 left-3 z-50 h-10 px-3.5 nordic-pill rounded-2xl flex items-center gap-2 hover:bg-muted/70 transition-colors"
        >
          <Logo className="h-3.5 w-auto text-foreground" />
          <span className="sr-only">SysDesign</span>
        </Link>
      )}

      {/* Floating Top-Center Navigation Pill */}
      <nav
        aria-label="Primary Navigation"
        className="fixed top-3 left-1/2 -translate-x-1/2 z-50 hidden md:flex items-center gap-0.5 p-1 nordic-pill rounded-2xl"
      >
        {TOP_NAV_ITEMS.map((item) => {
          const isActive = activeNavTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item)}
              className={cn(
                "h-8 px-3.5 rounded-xl text-[12.5px] font-medium transition-all cursor-pointer select-none",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Floating Top-Right Settings Cluster */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-1 p-1 nordic-pill rounded-2xl">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 h-8 px-2.5 rounded-xl hover:bg-muted/80 text-foreground transition-colors cursor-pointer outline-none select-none text-[12.5px] font-medium">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                className="size-5 rounded-full object-cover border border-border"
              />
            ) : (
              <IconSettings
                size={15}
                stroke={1.6}
                className="text-foreground/80"
              />
            )}
            <span className="hidden sm:inline-block max-w-24 truncate">
              {user ? user.user_metadata?.full_name || "Account" : "Settings"}
            </span>
            <IconChevronDown
              size={12}
              stroke={1.7}
              className="text-muted-foreground"
            />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="min-w-60 rounded-2xl p-1.5 shadow-xl border border-black/[0.06] dark:border-white/[0.08] space-y-0.5"
          >
            {user ? (
              <div className="px-2.5 py-2 bg-muted/60 rounded-xl mb-1 flex items-center justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {user.user_metadata?.full_name || "Signed In"}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  icon={<IconLogout size={14} />}
                  onClick={() => logout()}
                  className="rounded-lg text-destructive hover:bg-destructive/10"
                  title="Logout"
                />
              </div>
            ) : (
              <div className="p-2.5 bg-muted/60 rounded-xl mb-1 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <IconUserCircle size={15} className="text-foreground/80" />
                  <span className="text-xs font-semibold text-foreground">
                    Sign In
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Sync your system designs safely across devices.
                </p>
                <Button
                  onClick={() => login()}
                  disabled={loading || migrating}
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-xl bg-card text-xs w-full justify-center mt-1"
                  icon={
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        fill="#EA4335"
                      />
                    </svg>
                  }
                >
                  {migrating
                    ? "Migrating…"
                    : loading
                      ? "Signing in…"
                      : "Sign in with Google"}
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-muted/70 transition-colors">
              <span className="text-[12.5px] font-medium text-foreground">
                Theme
              </span>
              <ThemeToggle />
            </div>

            <DropdownMenuItem
              onClick={() => setAiSettingsOpen(true)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-[12.5px] font-medium cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <IconKey size={14} stroke={1.6} className="text-foreground/80" />
                <span>AI Provider Keys</span>
              </div>
              <span className="text-[11px] text-muted-foreground">Config</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Floating C4 Level Switcher — Below Top-Center Nav */}
      {isCanvasRoute && (diagramMode === "c4" || activeNavTab === "c4") && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 p-1 nordic-pill rounded-2xl animate-in fade-in duration-150">
          <span className="text-[11px] font-medium text-muted-foreground px-2 select-none flex items-center gap-1.5">
            <IconBrain size={13} stroke={1.6} className="text-foreground/75" />
            C4
          </span>
          {C4_LEVELS.map((lvl) => {
            const isCurrent = (c4Level || "context") === lvl.id;
            return (
              <Tooltip key={lvl.id}>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => setC4Level(lvl.id)}
                      className={cn(
                        "h-7 px-2.5 rounded-xl text-[11.5px] font-medium transition-all cursor-pointer select-none",
                        isCurrent
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      )}
                    >
                      {lvl.label}
                    </button>
                  }
                />
                <TooltipContent side="bottom">{lvl.tooltip}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      )}

      {/* Floating Bottom-Center Studio Dock */}
      {isCanvasRoute && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 p-1.5 nordic-pill rounded-2xl animate-in fade-in duration-200">
          {/* History */}
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    onClick={undo}
                    disabled={!canUndo}
                    variant="ghost"
                    size="icon-sm"
                    className="size-8 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                  >
                    <IconArrowBackUp size={16} stroke={1.6} />
                  </Button>
                }
              />
              <TooltipContent side="top">Undo (⌘Z)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    onClick={redo}
                    disabled={!canRedo}
                    variant="ghost"
                    size="icon-sm"
                    className="size-8 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                  >
                    <IconArrowForwardUp size={16} stroke={1.6} />
                  </Button>
                }
              />
              <TooltipContent side="top">Redo (⌘Y)</TooltipContent>
            </Tooltip>
          </div>

          <div className="w-px h-5 bg-border/70 mx-1" />

          {/* Layout & Utilities */}
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    onClick={() => {
                      autoLayout();
                      setTimeout(
                        () =>
                          fitView({
                            duration: 350,
                            padding: 0.2,
                            maxZoom: 1,
                          }),
                        50,
                      );
                    }}
                    disabled={!hasNodes}
                    variant="ghost"
                    size="icon-sm"
                    className="size-8 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                  >
                    <IconSitemap size={16} stroke={1.6} />
                  </Button>
                }
              />
              <TooltipContent side="top">Auto Layout</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    icon={IconGridDots}
                    onClick={toggleSnap}
                    variant="ghost"
                    size="icon-sm"
                    className={cn(
                      "size-8 rounded-xl transition-colors",
                      snapToGrid
                        ? "text-foreground bg-muted"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                    )}
                  />
                }
              />
              <TooltipContent side="top">
                {snapToGrid ? "Snap to Grid (On)" : "Snap to Grid (Off)"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    onClick={() => setClearConfirmOpen(true)}
                    disabled={!hasNodes}
                    variant="ghost"
                    size="icon-sm"
                    className="size-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30"
                  >
                    <IconTrash size={16} stroke={1.6} />
                  </Button>
                }
              />
              <TooltipContent side="top">Clear Canvas</TooltipContent>
            </Tooltip>
          </div>

          <div className="w-px h-5 bg-border/70 mx-1" />

          {/* Dark-mode Friendly Recessed Export Button */}
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={!hasNodes}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-muted hover:bg-accent text-foreground border border-black/[0.05] dark:border-white/[0.07] h-8 px-3.5 text-[12.5px] font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none outline-none"
            >
              <span>Export</span>
              <IconChevronDown size={13} stroke={1.7} className="opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="top"
              sideOffset={8}
              className="min-w-56 rounded-2xl p-1.5 space-y-0.5 shadow-xl border border-black/[0.06] dark:border-white/[0.08]"
            >
              <DropdownMenuLabel className="px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground">
                Export Format
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {EXPORT_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.key}
                  onClick={() => handleExport(opt.key)}
                  className="w-full flex flex-col items-start px-2.5 py-2 rounded-xl hover:bg-muted transition-colors cursor-pointer"
                >
                  <span className="text-[12.5px] font-medium text-foreground">
                    {opt.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {opt.desc}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Floating Bottom-Right Viewport Controls */}
      {isCanvasRoute && (
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 animate-in fade-in duration-200">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  onClick={() => fitView({ duration: 350, maxZoom: 1 })}
                  variant="ghost"
                  size="icon-sm"
                  className="size-9 rounded-xl nordic-pill hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <IconFocus2 size={16} stroke={1.6} />
                </Button>
              }
            />
            <TooltipContent side="top">Fit to Canvas (F)</TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-0.5 h-9 px-1 nordic-pill rounded-xl">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    onClick={() => zoomOut()}
                    variant="ghost"
                    size="icon-sm"
                    className="size-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <IconZoomOut size={15} stroke={1.6} />
                  </Button>
                }
              />
              <TooltipContent side="top">Zoom Out (-)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => zoomTo(1, { duration: 250 })}
                    className="px-2 h-7 min-w-11 text-center text-[12px] tabular-nums font-medium text-foreground/90 hover:text-foreground hover:bg-muted rounded-lg"
                  >
                    {Math.round(zoom * 100)}%
                  </Button>
                }
              />
              <TooltipContent side="top">Reset Zoom (100%)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    onClick={() => zoomIn()}
                    variant="ghost"
                    size="icon-sm"
                    className="size-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <IconZoomIn size={15} stroke={1.6} />
                  </Button>
                }
              />
              <TooltipContent side="top">Zoom In (+)</TooltipContent>
            </Tooltip>
          </div>

          {/* Navigation Tips Toggle & Popover */}
          <div className="relative">
            {showHint && (
              <div className="absolute bottom-full right-0 mb-2.5 animate-in slide-in-from-bottom-1 fade-in duration-150 z-50">
                <div className="relative nordic-panel rounded-[20px] p-4 w-72 overflow-hidden">
                  <div className="flex items-center justify-between mb-3 border-b border-border/60 pb-2">
                    <h6 className="text-[12.5px] font-semibold text-foreground">
                      Navigation Tips
                    </h6>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      icon={<IconX size={13} />}
                      onClick={toggleHint}
                      className="rounded-lg text-muted-foreground hover:text-foreground"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 bg-muted rounded-lg shrink-0 mt-0.5">
                        <IconMouse
                          size={13}
                          stroke={1.6}
                          className="text-foreground/75"
                        />
                      </div>
                      <div className="min-w-0 text-xs">
                        <span className="block font-medium text-foreground text-[12px]">
                          Canvas Controls
                        </span>
                        <p className="text-muted-foreground text-[11.5px] leading-relaxed">
                          Right-click drag to pan. Scroll to zoom. Left-click
                          drag to group.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 bg-muted rounded-lg shrink-0 mt-0.5">
                        <IconKeyboard
                          size={13}
                          stroke={1.6}
                          className="text-foreground/75"
                        />
                      </div>
                      <div className="min-w-0 text-xs flex-1">
                        <span className="block font-medium text-foreground text-[12px]">
                          Shortcuts
                        </span>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mt-1.5">
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <kbd className="px-1.5 py-0.5 rounded-md bg-muted border border-border text-[10px]">
                              ⌘K
                            </kbd>
                            <span>Search</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <kbd className="px-1.5 py-0.5 rounded-md bg-muted border border-border text-[10px]">
                              F
                            </kbd>
                            <span>Fit</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <kbd className="px-1.5 py-0.5 rounded-md bg-muted border border-border text-[10px]">
                              ⌘Z
                            </kbd>
                            <span>Undo</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <kbd className="px-1.5 py-0.5 rounded-md bg-muted border border-border text-[10px]">
                              Del
                            </kbd>
                            <span>Delete</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 bg-muted rounded-lg shrink-0 mt-0.5">
                        <IconClick
                          size={13}
                          stroke={1.6}
                          className="text-foreground/75"
                        />
                      </div>
                      <div className="min-w-0 text-xs">
                        <span className="block font-medium text-foreground text-[12px]">
                          Editing
                        </span>
                        <p className="text-muted-foreground text-[11.5px] leading-relaxed">
                          Double-click any node or edge to edit properties.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    onClick={toggleHint}
                    variant="ghost"
                    size="icon-sm"
                    className={cn(
                      "size-9 rounded-xl nordic-pill hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
                      showHint && "text-foreground bg-muted",
                    )}
                  >
                    <IconInfoCircle size={16} stroke={1.6} />
                  </Button>
                }
              />
              <TooltipContent side="top">Navigation Tips</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Floating AI Button & Chat Drawer */}
      {isCanvasRoute && <AIFloatingButton />}
      {isCanvasRoute && <AIChatDrawer />}
    </>
  );
}
