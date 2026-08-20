/**
 * @fileoverview Primary application header and floating canvas control docks (history, navigation, C4 level switcher, export).
 */

import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useReactFlow, useViewport } from "@xyflow/react";
import { useState } from "react";

import {
  IconAlertTriangle,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBook,
  IconBooks,
  IconBrain,
  IconCheck,
  IconChevronDown,
  IconClick,
  IconCompass,
  IconFocus2,
  IconFolderPlus,
  IconGridDots,
  IconHierarchy,
  IconInfoCircle,
  IconKey,
  IconKeyboard,
  IconLogout,
  IconMouse,
  IconNotebook,
  IconSettings,
  IconSitemap,
  IconSquarePlus,
  IconTrash,
  IconUserCircle,
  IconX,
  IconZoomIn,
  IconZoomOut,
} from "@tabler/icons-react";
import type {Template} from "@/data/templates";
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
import {
  
  createProject,
  login,
  logout,
  setActiveProject,
  useProjectStore
} from "@/store/project.store";
import type {ProjectType} from "@/store/project.store";
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
import ProjectSetupPopup from "@/components/dashboard/ProjectSetupPopup";
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
    label: "L1: Context",
    tooltip: "User personas, system boundaries & external systems",
  },
  {
    id: "container",
    label: "L2: Containers",
    tooltip: "Deployable apps, APIs, databases & queues",
  },
  {
    id: "component",
    label: "L3: Components",
    tooltip: "Internal services, controllers & data access modules",
  },
  {
    id: "code",
    label: "L4: Code",
    tooltip: "Class structures, interfaces & domain models",
  },
];

const TOP_NAV_ITEMS = [
  {
    id: "components",
    label: "Architecture",
    icon: IconCompass,
    path: "/$slug",
  },
  { id: "c4", label: "C4 Model", icon: IconBrain, path: "/$slug/c4" },
  { id: "templates", label: "Templates", icon: IconBook, path: "/templates" },
  {
    id: "integrations",
    label: "Integrations",
    icon: IconBooks,
    path: "/integrations",
  },
  { id: "flows", label: "Flows", icon: IconHierarchy, path: "/flows" },
  { id: "shapes", label: "Shapes", icon: IconNotebook, path: "/shapes" },
];

/**
 * Global application top header bar and floating diagram interaction docks.
 *
 * @returns Header and Dock control components
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
  const saveStatus = useCanvasStore((s) => s.saveStatus);
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
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
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

  const handleCreateNewProject = (
    name: string,
    type: ProjectType = "design",
    description?: string,
  ) => {
    const newProject = createProject(name, type, description);
    if (!newProject) return;
    setCreateProjectModalOpen(false);
    if (type === "c4") {
      navigate({ to: "/$slug/c4", params: { slug: newProject.slug } });
    } else {
      navigate({ to: "/$slug", params: { slug: newProject.slug } });
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

  return (
    <>
      <header
        className={cn(
          "h-11 flex items-center justify-between px-3.5 border-b border-border bg-background shrink-0 relative z-50 transition-all",
          isExporting && "opacity-0 invisible h-0 border-none",
        )}
      >
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

        <ProjectSetupPopup
          open={createProjectModalOpen}
          onClose={() => setCreateProjectModalOpen(false)}
          onCreate={handleCreateNewProject}
        />

        {/* AI Key Settings Dialog */}
        {aiSettingsOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-background/60 backdrop-blur-xs animate-in fade-in duration-200"
              onClick={() => setAiSettingsOpen(false)}
            />
            <div className="relative w-full max-w-md bg-card border border-border rounded-lg shadow-xl animate-in zoom-in-98 duration-150 p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <IconKey size={14} />
                  </div>
                  <h6 className="text-sm font-semibold text-foreground">
                    AI Provider Keys
                  </h6>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  icon={<IconX size={15} />}
                  onClick={() => setAiSettingsOpen(false)}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                />
              </div>
              <AISettings />
            </div>
          </div>
        )}

        {/* Left — brand + project selector */}
        <div className="flex items-center gap-2.5">
          <Link to="/" className="flex items-center gap-2 relative">
            <Logo className="h-3.5 w-auto" />
            <span className="sr-only">SysDesign — Systems Architecture</span>
          </Link>

          <div className="w-px h-4 bg-border/80 mx-0.5" />

          {/* Project Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer outline-none select-none">
              <span className="truncate max-w-32">
                {activeProject ? activeProject.name : "Select Project"}
              </span>
              <IconChevronDown
                size={12}
                className="text-muted-foreground shrink-0"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="min-w-52 rounded-md p-1 shadow-lg"
            >
              <DropdownMenuLabel className="px-2 py-1 text-[11px] font-medium text-muted-foreground">
                Projects
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar">
                {projects.map((p) => (
                  <DropdownMenuItem
                    key={p.id}
                    onClick={() => {
                      setActiveProject(p.id);
                      navigate({ to: "/$slug", params: { slug: p.slug } });
                    }}
                    className={cn(
                      "w-full flex items-center justify-start px-2 py-1.5 gap-2 rounded-sm text-xs cursor-pointer",
                      p.id === activeProjectId &&
                        "bg-primary/10 text-primary font-medium",
                    )}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{p.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setCreateProjectModalOpen(true)}
                className="w-full flex items-center justify-start px-2 py-1.5 gap-2 text-xs font-medium text-primary hover:bg-primary/10 rounded-sm cursor-pointer"
              >
                <IconFolderPlus size={14} />
                <span>New Project</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate({ to: "/projects" })}
                className="w-full flex items-center justify-start px-2 py-1.5 gap-2 text-xs font-medium text-muted-foreground hover:bg-muted rounded-sm cursor-pointer"
              >
                <IconSquarePlus size={14} />
                <span>All Projects</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isCanvasRoute && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-muted/40 text-muted-foreground border border-border/40">
              {nodes.length} nodes · {edges.length} edges
            </span>
          )}

          {isCanvasRoute && saveStatus !== "idle" && (
            <span
              className={cn(
                "flex items-center gap-1.5 text-[11px] font-medium transition-opacity",
                saveStatus === "error"
                  ? "text-destructive"
                  : "text-muted-foreground",
              )}
            >
              {saveStatus === "saving" && (
                <>
                  <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                  Saving…
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <IconCheck size={12} className="text-emerald-500" />
                  Saved
                </>
              )}
              {saveStatus === "error" && (
                <>
                  <IconAlertTriangle size={12} />
                  Save failed
                </>
              )}
            </span>
          )}
        </div>

        {/* Right — Top Navigation & Settings Dropdown */}
        <div className="flex items-center gap-2">
          <nav className="hidden lg:flex items-center gap-0.5 p-0.5 rounded-md bg-muted/60 border border-border/60">
            {TOP_NAV_ITEMS.map((item) => {
              const isActive = activeNavTab === item.id;
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  type="button"
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  icon={
                    <Icon
                      size={12}
                      stroke={1.6}
                      className={cn(
                        "shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                  }
                  iconPlacement="left"
                  onClick={() => handleNavClick(item)}
                  className={cn(
                    "h-6 px-2 rounded-xs text-xs font-medium border",
                    isActive
                      ? "bg-primary/12 text-primary border-primary/30 font-semibold shadow-none"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border-transparent",
                  )}
                >
                  {item.label}
                </Button>
              );
            })}
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer outline-none select-none text-xs font-medium">
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt=""
                  className="size-4 rounded-full object-cover border border-primary/40"
                />
              ) : (
                <IconSettings size={14} className="text-muted-foreground" />
              )}
              <span className="hidden sm:inline-block max-w-24 truncate">
                {user ? user.user_metadata?.full_name || "Account" : "Settings"}
              </span>
              <IconChevronDown size={11} className="text-muted-foreground" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="min-w-56 rounded-md p-1 shadow-lg space-y-0.5"
            >
              {user ? (
                <div className="px-2.5 py-2 bg-muted/40 rounded-sm border border-border/40 mb-1 flex items-center justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {user.user_metadata?.full_name || "Signed In"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    icon={<IconLogout size={14} />}
                    onClick={() => logout()}
                    className="p-1 rounded text-destructive hover:bg-destructive/10"
                    title="Logout"
                  />
                </div>
              ) : (
                <div className="p-2.5 bg-primary/5 rounded-sm border border-primary/15 mb-1 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <IconUserCircle size={15} className="text-primary" />
                    <span className="text-xs font-semibold">Sign In</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground ">
                    Sync your system designs safely across devices.
                  </p>
                  <Button
                    onClick={() => login()}
                    disabled={loading || migrating}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs w-full justify-center mt-1"
                    icon={
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
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

              <div className="flex items-center justify-between px-2 py-1.5 rounded-sm hover:bg-muted transition-colors">
                <span className="text-xs font-medium">Theme</span>
                <ThemeToggle />
              </div>

              <DropdownMenuItem
                onClick={() => setAiSettingsOpen(true)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-sm text-xs font-medium cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <IconKey size={14} className="text-primary" />
                  <span>AI Provider Keys</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Config
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Floating C4 Level Breadcrumbs Toolbar — Centered Below Header */}
      {isCanvasRoute &&
        (diagramMode === "c4" || activeNavTab === "c4") &&
        !isExporting && (
          <div className="fixed top-13 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 px-2 py-0.5 bg-card border border-border rounded-xs shadow-xs animate-in fade-in duration-150">
            <span className="text-[10px] font-mono font-medium text-muted-foreground mr-1 select-none flex items-center gap-1">
              <IconBrain size={12} className="text-primary" />
              C4:
            </span>
            {C4_LEVELS.map((lvl, idx) => {
              const isCurrent = (c4Level || "context") === lvl.id;
              return (
                <div key={lvl.id} className="flex items-center">
                  {idx > 0 && (
                    <span className="text-[10px] text-muted-foreground/35 mx-0.5 select-none">
                      /
                    </span>
                  )}
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant={isCurrent ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => setC4Level(lvl.id)}
                          className={cn(
                            "px-1.5 py-0.5 h-auto rounded-xs text-[10px] font-mono border",
                            isCurrent
                              ? "bg-primary/12 text-primary border-primary/30 font-semibold shadow-none"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted border-transparent",
                          )}
                        >
                          {lvl.label}
                        </Button>
                      }
                    />
                    <TooltipContent side="bottom">{lvl.tooltip}</TooltipContent>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        )}

      {/* Floating Bottom Toolbar — Floating Center Dock */}
      {isCanvasRoute && !isExporting && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 animate-in fade-in duration-200">
          <div className="flex items-center gap-0.5 p-0.5 bg-card border border-border rounded-md shadow-xs">
            {/* History Dock */}
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      onClick={undo}
                      disabled={!canUndo}
                      variant="ghost"
                      size="icon-sm"
                      className="size-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                    >
                      <IconArrowBackUp size={15} stroke={1.5} />
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
                      className="size-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                    >
                      <IconArrowForwardUp size={15} stroke={1.5} />
                    </Button>
                  }
                />
                <TooltipContent side="top">Redo (⌘Y)</TooltipContent>
              </Tooltip>
            </div>

            <div className="w-px h-4 bg-border mx-1" />

            {/* Navigation Dock */}
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      onClick={() => zoomOut()}
                      variant="ghost"
                      size="icon-sm"
                      className="size-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <IconZoomOut size={15} stroke={1.5} />
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
                      className="px-1.5 py-0.5 h-7 min-w-10 text-center text-[11px] font-mono font-medium text-foreground/80 hover:text-foreground hover:bg-muted rounded"
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
                      className="size-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <IconZoomIn size={15} stroke={1.5} />
                    </Button>
                  }
                />
                <TooltipContent side="top">Zoom In (+)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      onClick={() => fitView({ duration: 350, maxZoom: 1 })}
                      variant="ghost"
                      size="icon-sm"
                      className="size-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <IconFocus2 size={15} stroke={1.5} />
                    </Button>
                  }
                />
                <TooltipContent side="top">Fit to Canvas (F)</TooltipContent>
              </Tooltip>

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
                      className="size-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                    >
                      <IconSitemap size={15} stroke={1.5} />
                    </Button>
                  }
                />
                <TooltipContent side="top">Auto Layout</TooltipContent>
              </Tooltip>
            </div>

            <div className="w-px h-4 bg-border mx-1" />

            {/* Utility Actions */}
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      icon={IconGridDots}
                      onClick={toggleSnap}
                      variant={snapToGrid ? "secondary" : "ghost"}
                      size="icon-sm"
                      className={cn(
                        "size-7 rounded transition-colors",
                        snapToGrid
                          ? "text-primary bg-primary/10 border border-primary/30"
                          : "text-muted-foreground hover:bg-muted",
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
                      className="size-7 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30"
                    >
                      <IconTrash size={15} stroke={1.5} />
                    </Button>
                  }
                />
                <TooltipContent side="top">Clear Canvas</TooltipContent>
              </Tooltip>
            </div>

            <div className="w-px h-4 bg-border mx-1" />

            {/* Primary Action: Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={!hasNodes}
                className="inline-flex items-center justify-center gap-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 h-7 px-2.5 text-xs font-medium transition-colors shadow-xs cursor-pointer disabled:opacity-40 disabled:pointer-events-none outline-none"
              >
                <span>Export</span>
                <IconChevronDown size={12} />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="top"
                className="min-w-56 rounded-md p-1 space-y-0.5 shadow-lg"
              >
                <DropdownMenuLabel className="px-2 py-1 text-[11px] font-medium text-muted-foreground">
                  Export Format
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {EXPORT_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.key}
                    onClick={() => handleExport(opt.key)}
                    className="w-full flex flex-col items-start px-2 py-1.5 rounded-sm hover:bg-muted transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-medium text-foreground">
                      {opt.label}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {opt.desc}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Navigation Tips Toggle & Popover */}
          <div className="relative">
            {showHint && (
              <div className="absolute bottom-full right-0 mb-2 animate-in slide-in-from-bottom-1 fade-in duration-150 z-50">
                <div className="relative bg-card border border-border rounded-md p-4 w-68 shadow-lg overflow-hidden">
                  <div className="flex items-center justify-between mb-3 border-b border-border/60 pb-2">
                    <h6 className="text-xs font-semibold text-foreground">
                      Navigation Tips
                    </h6>
                    <Button
                      variant="ghost"
                      size="icon"
                      icon={<IconX size={13} />}
                      onClick={toggleHint}
                      className="p-0.5 rounded text-muted-foreground hover:text-foreground"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1 bg-muted/60 rounded shrink-0 mt-0.5">
                        <IconMouse
                          size={13}
                          className="text-muted-foreground"
                        />
                      </div>
                      <div className="min-w-0 text-xs">
                        <span className="block font-medium text-foreground text-[11px]">
                          Canvas Controls
                        </span>
                        <p className="text-muted-foreground text-[11px] leading-relaxed">
                          Right-click drag to pan. Scroll to zoom. Left-click
                          drag to group.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="p-1 bg-muted/60 rounded shrink-0 mt-0.5">
                        <IconKeyboard
                          size={13}
                          className="text-muted-foreground"
                        />
                      </div>
                      <div className="min-w-0 text-xs flex-1">
                        <span className="block font-medium text-foreground text-[11px]">
                          Shortcuts
                        </span>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1">
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px] font-mono">
                              ⌘G
                            </kbd>
                            <span>Group</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px] font-mono">
                              F
                            </kbd>
                            <span>Fit</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px] font-mono">
                              ⌘Z
                            </kbd>
                            <span>Undo</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px] font-mono">
                              Del
                            </kbd>
                            <span>Delete</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="p-1 bg-muted/60 rounded shrink-0 mt-0.5">
                        <IconClick
                          size={13}
                          className="text-muted-foreground"
                        />
                      </div>
                      <div className="min-w-0 text-xs">
                        <span className="block font-medium text-foreground text-[11px]">
                          Editing
                        </span>
                        <p className="text-muted-foreground text-[11px] leading-relaxed">
                          Double-click any node/edge to edit properties.
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
                    variant="outline"
                    size="icon-sm"
                    className={cn(
                      "size-7 rounded-md shadow-xs bg-card border border-border hover:bg-muted transition-colors cursor-pointer",
                      showHint &&
                        "border-primary/50 text-primary bg-primary/10",
                    )}
                  >
                    <IconInfoCircle size={15} stroke={1.5} />
                  </Button>
                }
              />
              <TooltipContent side="top">Navigation Tips</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Floating AI Button on the right middle of screen */}
      {isCanvasRoute && !isExporting && <AIFloatingButton />}

      {/* AI Chat Drawer */}
      {isCanvasRoute && !isExporting && <AIChatDrawer />}
    </>
  );
}
