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
  IconHome,
  IconInfoCircle,
  IconKey,
  IconKeyboard,
  IconLayout,
  IconLogout,
  IconMouse,
  IconPlug,
  IconSettings,
  IconShape,
  IconSitemap,
  IconStack2,
  IconTopologyStar3,
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
  { id: "components", label: "Architecture", path: "/$slug", icon: IconHome },
  { id: "c4", label: "C4 Model", path: "/$slug/c4", icon: IconSitemap },
  { id: "templates", label: "Templates", path: "/templates", icon: IconLayout },
  {
    id: "integrations",
    label: "Integrations",
    path: "/integrations",
    icon: IconPlug,
  },
  { id: "flows", label: "Flows", path: "/flows", icon: IconTopologyStar3 },
  { id: "shapes", label: "Shapes", path: "/shapes", icon: IconShape },
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
    if ((key === "png" || key === "svg") && hasNodes) {
      fitView({ padding: 0.15, duration: 0, maxZoom: 1 });
    }
    await new Promise((r) => setTimeout(r, 120));

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
        description="This will remove all nodes and edges from your design."
        confirmText="Clear Canvas"
        isDestructive
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
          <div className="relative w-full max-w-md nordic-panel rounded-xl animate-in zoom-in-98 duration-150 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-muted flex items-center justify-center text-foreground">
                  <IconKey size={14} stroke={1.6} />
                </div>
                <h4 className="text-sm font-medium text-foreground">
                  AI Provider Keys
                </h4>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                icon={<IconX size={16} />}
                onClick={() => setAiSettingsOpen(false)}
                aria-label="Close AI settings"
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
          className="fixed top-3 left-3 z-50 h-10 px-3.5 nordic-panel rounded-2xl flex items-center gap-2 hover:bg-muted/70 transition-colors"
        >
          <Logo className="h-3.5 w-auto text-foreground" />
          <span className="sr-only">SysDesign</span>
        </Link>
      )}

      {/* Floating Top-Center Navigation Pill */}
      <nav
        aria-label="Primary Navigation"
        className="fixed top-3 left-1/2 -translate-x-1/2 z-50 hidden md:flex items-center gap-0.5 p-1 nordic-panel rounded-full"
      >
        {TOP_NAV_ITEMS.map((item) => {
          const isActive = activeNavTab === item.id;
          const NavIcon = item.icon;
          return (
            <Button
              key={item.id}
              type="button"
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleNavClick(item)}
              icon={<NavIcon size={16} stroke={1.6} />}
              iconPlacement="left"
              className={cn(
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </Button>
          );
        })}
      </nav>

      {/* Floating Top-Right Settings Cluster */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-1 p-1 nordic-panel rounded-full">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 h-8 px-2.5 rounded-full hover:bg-muted/80 text-foreground transition-colors cursor-pointer outline-none select-none text-body font-medium">
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
            className="min-w-60 rounded-2xl p-1.5 shadow-xl border border-border space-y-0.5"
          >
            {user ? (
              <div className="px-2.5 py-2 bg-muted/60 rounded-xl mb-1 flex items-center justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {user.user_metadata?.full_name || "Signed In"}
                  </p>
                  <p className="text-caption text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  icon={<IconLogout size={16} />}
                  onClick={() => logout()}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Sign out"
                />
              </div>
            ) : (
              <div className="p-2.5 bg-muted/60 rounded-xl mb-1 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <IconUserCircle size={15} className="text-foreground/80" />
                  <span className="text-xs font-medium text-foreground">
                    Sign In
                  </span>
                </div>
                <p className="text-caption text-muted-foreground leading-snug">
                  Sync your system designs safely across devices.
                </p>
                <Button
                  variant="outline"
                  onClick={() => login()}
                  disabled={loading || migrating}
                  size="sm"
                  className="w-full justify-center mt-1"
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
              <span className="text-body font-medium text-foreground">
                Theme
              </span>
              <ThemeToggle />
            </div>

            <DropdownMenuItem
              onClick={() => setAiSettingsOpen(true)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-body font-medium cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <IconKey size={14} stroke={1.6} className="text-foreground/80" />
                <span>AI Provider Keys</span>
              </div>
              <span className="text-caption text-muted-foreground">Config</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Floating C4 Level Switcher: Below Top-Center Nav */}
      {isCanvasRoute && (diagramMode === "c4" || activeNavTab === "c4") && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 p-1 nordic-panel rounded-2xl animate-in fade-in duration-150">
          <span className="text-caption font-medium text-muted-foreground px-2 select-none flex items-center gap-1.5">
            <IconBrain size={13} stroke={1.6} className="text-foreground/75" />
            C4
          </span>
          {C4_LEVELS.map((lvl) => {
            const isCurrent = (c4Level || "context") === lvl.id;
            return (
              <Tooltip key={lvl.id}>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant={isCurrent ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setC4Level(lvl.id)}
                      className={cn(
                        isCurrent ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {lvl.label}
                    </Button>
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
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 animate-in fade-in duration-200">
          {/* Main Segmented Canvas Controls Pill */}
          <div className="flex items-center gap-0.5 p-1 nordic-panel rounded-full">
            {/* History */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    onClick={undo}
                    disabled={!canUndo}
                    size="icon-sm"
                    aria-label="Undo"
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
                    variant="ghost"
                    onClick={redo}
                    disabled={!canRedo}
                    size="icon-sm"
                    aria-label="Redo"
                  >
                    <IconArrowForwardUp size={16} stroke={1.6} />
                  </Button>
                }
              />
              <TooltipContent side="top">Redo (⌘Y)</TooltipContent>
            </Tooltip>

            <div className="w-px h-4 bg-border/70 mx-1" />

            {/* Layout & Snap */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
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
                    size="icon-sm"
                    aria-label="Auto Layout"
                  >
                    <IconStack2 size={16} stroke={1.6} />
                  </Button>
                }
              />
              <TooltipContent side="top">Auto Layout</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant={snapToGrid ? "secondary" : "ghost"}
                    icon={IconGridDots}
                    onClick={toggleSnap}
                    size="icon-sm"
                    aria-label="Snap to Grid"
                  />
                }
              />
              <TooltipContent side="top">
                {snapToGrid ? "Snap to Grid (On)" : "Snap to Grid (Off)"}
              </TooltipContent>
            </Tooltip>

            <div className="w-px h-4 bg-border/70 mx-1" />

            {/* Zoom Controls */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    onClick={() => zoomOut()}
                    size="icon-sm"
                    aria-label="Zoom Out"
                  >
                    <IconZoomOut size={16} stroke={1.6} />
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
                    className="px-2 min-w-11 text-center text-small tabular-nums text-foreground"
                    aria-label="Reset Zoom"
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
                    variant="ghost"
                    onClick={() => zoomIn()}
                    size="icon-sm"
                    aria-label="Zoom In"
                  >
                    <IconZoomIn size={16} stroke={1.6} />
                  </Button>
                }
              />
              <TooltipContent side="top">Zoom In (+)</TooltipContent>
            </Tooltip>

            <div className="w-px h-4 bg-border/70 mx-1" />

            {/* Fit to Canvas */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    onClick={() => fitView({ duration: 350, maxZoom: 1 })}
                    size="icon-sm"
                    aria-label="Fit to Canvas"
                  >
                    <IconFocus2 size={16} stroke={1.6} />
                  </Button>
                }
              />
              <TooltipContent side="top">Fit to Canvas (F)</TooltipContent>
            </Tooltip>

            {/* Clear Canvas */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="destructive"
                    onClick={() => setClearConfirmOpen(true)}
                    disabled={!hasNodes}
                    size="icon-sm"
                    aria-label="Clear Canvas"
                  >
                    <IconTrash size={16} stroke={1.6} />
                  </Button>
                }
              />
              <TooltipContent side="top">Clear Canvas</TooltipContent>
            </Tooltip>
          </div>

          {/* Circular Info / Navigation Tips Button */}
          <div className="relative">
            {showHint && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 animate-in slide-in-from-bottom-1 fade-in duration-150 z-50">
                <div className="relative nordic-panel rounded-xl p-4 w-72 overflow-hidden">
                  <div className="flex items-center justify-between mb-3 border-b border-border/60 pb-2">
                    <h4 className="text-body font-medium text-foreground">
                      Navigation Tips
                    </h4>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      icon={<IconX size={16} />}
                      onClick={toggleHint}
                      aria-label="Close navigation tips"
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
                        <span className="block font-medium text-foreground text-small">
                          Canvas Controls
                        </span>
                        <p className="text-muted-foreground text-caption leading-relaxed">
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
                        <span className="block font-medium text-foreground text-small">
                          Shortcuts
                        </span>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mt-1.5">
                          <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
                            <kbd className="px-1.5 py-0.5 rounded-md bg-muted border border-border text-caption">
                              ⌘K
                            </kbd>
                            <span>Search</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
                            <kbd className="px-1.5 py-0.5 rounded-md bg-muted border border-border text-caption">
                              F
                            </kbd>
                            <span>Fit</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
                            <kbd className="px-1.5 py-0.5 rounded-md bg-muted border border-border text-caption">
                              ⌘Z
                            </kbd>
                            <span>Undo</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
                            <kbd className="px-1.5 py-0.5 rounded-md bg-muted border border-border text-caption">
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
                        <span className="block font-medium text-foreground text-small">
                          Editing
                        </span>
                        <p className="text-muted-foreground text-caption leading-relaxed">
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
                    variant="ghost"
                    onClick={toggleHint}
                    size="icon-lg"
                    className={cn(
                      "nordic-panel",
                      showHint && "text-foreground bg-muted",
                    )}
                    aria-label="Navigation Tips"
                  >
                    <IconInfoCircle size={16} stroke={1.6} />
                  </Button>
                }
              />
              <TooltipContent side="top">Navigation Tips</TooltipContent>
            </Tooltip>
          </div>

          {/* Shiny Primary Export Pill Button */}
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={!hasNodes}
              className="shiny-primary-btn inline-flex items-center justify-center gap-1.5 rounded-full h-10 px-5 text-body font-medium cursor-pointer disabled:opacity-40 disabled:pointer-events-none outline-none"
            >
              <span>Export</span>
              <IconChevronDown size={13} stroke={1.8} className="opacity-85" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="top"
              sideOffset={8}
              className="min-w-56 rounded-2xl p-1.5 space-y-0.5 shadow-xl border border-border"
            >
              <DropdownMenuLabel className="px-2.5 py-1.5 text-caption font-medium text-muted-foreground">
                Export Format
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {EXPORT_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.key}
                  onClick={() => handleExport(opt.key)}
                  className="w-full flex flex-col items-start px-2.5 py-2 rounded-xl hover:bg-muted transition-colors cursor-pointer"
                >
                  <span className="text-body font-medium text-foreground">
                    {opt.label}
                  </span>
                  <span className="text-caption text-muted-foreground">
                    {opt.desc}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Floating AI Button & Chat Drawer */}
      {isCanvasRoute && <AIFloatingButton />}
      {isCanvasRoute && <AIChatDrawer />}
    </>
  );
}
