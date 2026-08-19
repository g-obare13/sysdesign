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
  IconCompass,
  IconFocus2,
  IconFolderPlus,
  IconGridDots,
  IconHierarchy,
  IconKey,
  IconLogout,
  IconNotebook,
  IconSettings,
  IconSitemap,
  IconSquarePlus,
  IconTrash,
  IconUserCircle,
  IconZoomIn,
  IconZoomOut,
  IconX,
  IconMouse,
  IconClick,
  IconKeyboard,
  IconInfoCircle,
} from "@tabler/icons-react";
import { type Template } from "../../data/templates";
import {
  autoLayout,
  clearCanvas,
  loadTemplate,
  redo,
  setDiagramMode,
  setExportingState,
  toggleSnap,
  undo,
  useCanvasStore,
} from "../../store/canvas.store";
import {
  createProject,
  login,
  logout,
  setActiveProject,
  useProjectStore,
  type ProjectType,
} from "../../store/project.store";
import {
  exportMermaid,
  exportPng,
  exportStructurizr,
  exportSvgFile,
  exportTerraform,
} from "../export/exportUtils";
import { ThemeToggle } from "../ThemeToggle";
import { Button } from "../ui/button";
import ConfirmModal from "../ui/ConfirmModal";
import ProjectSetupPopup from "../dashboard/ProjectSetupPopup";
import { Logo } from "../ui/logo";
import { cn } from "@/lib/utils";
import AISettings from "../ai/AISettings";
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
  const [switchConfirmTab, setSwitchConfirmTab] = useState<string | null>(null);
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

    const isSwitchingToC4 = item.id === "c4" && diagramMode !== "c4";
    const isSwitchingToArch =
      item.id === "components" && diagramMode !== "architecture";

    if (
      (isSwitchingToC4 || isSwitchingToArch) &&
      (nodes.length > 0 || edges.length > 0)
    ) {
      setSwitchConfirmTab(item.id);
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
          "h-14 flex items-center justify-between px-4 border-b border-border/50 bg-background/95 backdrop-blur-md shrink-0 relative z-50 transition-all",
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

        <ConfirmModal
          open={!!switchConfirmTab}
          isDestructive
          title="Clear Canvas?"
          description={`Switching to ${switchConfirmTab === "c4" ? "C4 Model" : "Architecture"} mode will clear your current canvas.`}
          confirmText="Clear & Switch"
          onClose={() => setSwitchConfirmTab(null)}
          onConfirm={() => {
            if (switchConfirmTab) {
              clearCanvas();
              setDiagramMode(switchConfirmTab === "c4" ? "c4" : "architecture");
              if (switchConfirmTab === "c4") {
                if (activeProject)
                  navigate({
                    to: "/$slug/c4",
                    params: { slug: activeProject.slug } as any,
                  });
              } else {
                if (activeProject)
                  navigate({
                    to: "/$slug",
                    params: { slug: activeProject.slug } as any,
                  });
              }
              setSwitchConfirmTab(null);
            }
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
              className="absolute inset-0 bg-background/60 backdrop-blur-sm animate-in fade-in duration-300"
              onClick={() => setAiSettingsOpen(false)}
            />
            <div className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <IconKey size={18} />
                  </div>
                  <h2 className="text-base font-bold">AI Provider Keys</h2>
                </div>
                <button
                  onClick={() => setAiSettingsOpen(false)}
                  className="p-1 rounded-full hover:bg-muted text-muted-foreground"
                >
                  <IconX size={18} />
                </button>
              </div>
              <AISettings />
            </div>
          </div>
        )}

        {/* Left — brand + project selector */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 relative">
            <Logo className="h-4 w-auto" />
            <h1 className="sr-only">SysDesign — Systems Architecture</h1>
          </Link>

          {/* Project Selector Shadcn Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold text-foreground transition-all  cursor-pointer outline-none">
              <span className="truncate max-w-35">
                {activeProject ? activeProject.name : "Select Project"}
              </span>
              <IconChevronDown
                size={14}
                className="text-muted-foreground transition-transform duration-200"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="min-w-55 rounded-lg p-1.5 shadow-2xl"
            >
              <DropdownMenuLabel className="px-3 py-1.5 text-sm font-medium text-foreground">
                Switch Project
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
                      "w-full flex items-center justify-start px-3 py-2 gap-2 rounded-sm text-xs cursor-pointer",
                      p.id === activeProjectId &&
                        "bg-primary/10 text-primary font-bold",
                    )}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{p.name}</span>
                      <span className="text-xs text-foreground truncate">
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setCreateProjectModalOpen(true)}
                className="w-full flex items-center justify-start px-3 py-2 gap-2 text-xs font-semibold text-primary hover:bg-primary/10 rounded-sm cursor-pointer"
              >
                <IconFolderPlus size={15} />
                <span>New Project</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate({ to: "/projects" })}
                className="w-full flex items-center justify-start px-3 py-2 gap-2 text-xs font-semibold text-muted-foreground hover:bg-muted rounded-sm cursor-pointer"
              >
                <IconSquarePlus size={15} />
                <span>All Projects</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isCanvasRoute && (
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted/50 text-muted-foreground border border-border/30">
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
                  <span className="size-2 rounded-full bg-primary animate-pulse" />
                  Saving…
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <IconCheck size={13} className="text-emerald-500" />
                  Saved
                </>
              )}
              {saveStatus === "error" && (
                <>
                  <IconAlertTriangle size={13} />
                  Save failed
                </>
              )}
            </span>
          )}
        </div>

        {/* Center — Top Navigation Pill Bar */}
        <nav className="hidden lg:flex items-center gap-1.5 p-1 rounded-full">
          {TOP_NAV_ITEMS.map((item) => {
            const isActive = activeNavTab === item.id;
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={isActive ? "shiny" : "ghost"}
                onClick={() => handleNavClick(item)}
                className={"rounded-full"}
                icon={
                  <Icon
                    size={15}
                    stroke={1.8}
                    className={
                      isActive
                        ? "text-neutral-50 shrink-0"
                        : "text-muted-foreground shrink-0"
                    }
                  />
                }
              >
                <span>{item.label}</span>
              </Button>
            );
          })}
        </nav>

        {/* Right — Settings & User Profile Shadcn Dropdown */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-muted/30  text-foreground transition-all cursor-pointer outline-none">
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt=""
                  className="size-5 rounded-full object-cover border border-primary/30"
                />
              ) : (
                <IconSettings size={16} className="text-muted-foreground" />
              )}
              <span className="hidden sm:inline-block max-w-25 truncate">
                {user ? user.user_metadata?.full_name || "Account" : "Settings"}
              </span>
              <IconChevronDown
                size={13}
                className="text-muted-foreground transition-transform duration-200"
              />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="min-w-60 rounded-2xl p-2 shadow-2xl space-y-1"
            >
              {user ? (
                <div className="px-3 py-2.5 bg-muted/40 rounded-xl border border-border/40 mb-1 flex items-center justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <p className="text-xs font-bold truncate">
                      {user.user_metadata?.full_name || "Signed In"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={() => logout()}
                    className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    title="Logout"
                  >
                    <IconLogout size={16} />
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-primary/5 rounded-xl border border-primary/15 mb-1 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <IconUserCircle size={18} className="text-primary" />
                    <span className="text-xs font-bold">Sign In</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Sync your system designs safely across devices.
                  </p>
                  <Button
                    onClick={() => login()}
                    disabled={loading || migrating}
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-2 w-full justify-center"
                    icon={
                      <svg
                        width="14"
                        height="14"
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

              <div className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 rounded-xl transition-colors">
                <span className="text-xs font-semibold">Theme</span>
                <ThemeToggle />
              </div>

              <DropdownMenuItem
                onClick={() => setAiSettingsOpen(true)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 rounded-xl transition-colors text-xs font-semibold cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <IconKey size={15} className="text-primary" />
                  <span>AI API Keys</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Config
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Floating Bottom Toolbar — Floating Center Dock */}
      {isCanvasRoute && !isExporting && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-1 p-1.5 bg-card/90 backdrop-blur-md border border-border/60 rounded-full shadow-2xl">
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
                      className="h-9 w-9 rounded-full hover:bg-muted transition-colors disabled:opacity-30"
                    >
                      <IconArrowBackUp size={18} stroke={1.5} />
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
                      className="h-9 w-9 rounded-full hover:bg-muted transition-colors disabled:opacity-30"
                    >
                      <IconArrowForwardUp size={18} stroke={1.5} />
                    </Button>
                  }
                />
                <TooltipContent side="top">Redo (⌘Y)</TooltipContent>
              </Tooltip>
            </div>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Navigation Dock */}
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      onClick={() => zoomOut()}
                      variant="ghost"
                      size="icon-sm"
                      className="h-9 w-9 rounded-full hover:bg-muted transition-colors"
                    >
                      <IconZoomOut size={18} stroke={1.5} />
                    </Button>
                  }
                />
                <TooltipContent side="top">Zoom Out (-)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      onClick={() => zoomTo(1, { duration: 300 })}
                      className="px-2 py-1 min-w-12 text-center text-xs font-mono font-semibold text-foreground/80 hover:text-foreground hover:bg-muted rounded-md transition-all cursor-pointer select-none"
                    >
                      {Math.round(zoom * 100)}%
                    </button>
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
                      className="h-9 w-9 rounded-full hover:bg-muted transition-colors"
                    >
                      <IconZoomIn size={18} stroke={1.5} />
                    </Button>
                  }
                />
                <TooltipContent side="top">Zoom In (+)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      onClick={() => fitView({ duration: 450, maxZoom: 1 })}
                      variant="ghost"
                      size="icon-sm"
                      className="h-9 w-9 rounded-full hover:bg-muted transition-colors"
                    >
                      <IconFocus2 size={18} stroke={1.5} />
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
                              duration: 450,
                              padding: 0.2,
                              maxZoom: 1,
                            }),
                          60,
                        );
                      }}
                      disabled={!hasNodes}
                      variant="ghost"
                      size="icon-sm"
                      className="h-9 w-9 rounded-full hover:bg-muted transition-colors disabled:opacity-30"
                    >
                      <IconSitemap size={18} stroke={1.5} />
                    </Button>
                  }
                />
                <TooltipContent side="top">Auto Layout</TooltipContent>
              </Tooltip>
            </div>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Utility Actions */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      icon={IconGridDots}
                      onClick={toggleSnap}
                      variant={snapToGrid ? "default" : "outline"}
                      loading={loading}
                      size="sm"
                      className="rounded-full"
                    />
                  }
                />
                <TooltipContent side="top">
                  {snapToGrid ? "Snap to Grid (On)" : "Snap to Grid (Off)"}
                </TooltipContent>
              </Tooltip>

              <div className="w-px h-6 bg-border mx-1" />

              <Button
                onClick={() => setClearConfirmOpen(true)}
                disabled={!hasNodes}
                icon={IconTrash}
                loading={loading}
                iconPlacement="left"
                variant="destructive"
                size="sm"
                className="rounded-full text-destructive hover:bg-destructive/10 border-transparent hover:border-destructive/20"
              >
                Clear
              </Button>
            </div>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Primary Action: Export Shadcn Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={!hasNodes}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary-600 px-3.5 py-1.5 text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:pointer-events-none outline-none"
              >
                <span>Export</span>
                <IconChevronDown size={14} />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="top"
                className="min-w-[200px] rounded-2xl p-1.5 shadow-2xl space-y-0.5"
              >
                <DropdownMenuLabel className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none">
                  Export Format
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {EXPORT_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.key}
                    onClick={() => handleExport(opt.key)}
                    className="w-full flex flex-col items-start px-3 py-2 rounded-xl hover:bg-muted transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-semibold text-foreground">
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {opt.desc}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Navigation Tips Floating Outside on the Right */}
          <div className="relative">
            {showHint && (
              <div className="absolute bottom-full right-0 mb-3 animate-in slide-in-from-bottom-2 fade-in duration-300 z-50">
                <div className="relative bg-card border border-border rounded-2xl p-5 shadow-2xl w-72 overflow-hidden">
                  <button
                    onClick={toggleHint}
                    className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer rounded-full"
                  >
                    <IconX size={14} />
                  </button>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <IconMouse size={16} className="text-primary" />
                    </div>
                    <h4 className="text-xs font-semibold tracking-tight">
                      Navigation Tips
                    </h4>
                  </div>

                  <div className="space-y-3.5">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-muted/50 rounded-lg shrink-0">
                        <IconMouse size={14} className="text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold">
                          Canvas Control
                        </div>
                        <div className="text-[10px] text-muted-foreground leading-relaxed">
                          <span className="block font-medium text-foreground/80">
                            Right-click + Drag
                          </span>{" "}
                          Pan the design board
                          <span className="block font-medium text-foreground/80 mt-1">
                            Left-click + Drag
                          </span>{" "}
                          Draw box to Auto-Group
                          <span className="block font-medium text-foreground/80 mt-1">
                            Scroll Wheel
                          </span>{" "}
                          Zoom in and out
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-muted/50 rounded-lg shrink-0">
                        <IconKeyboard
                          size={14}
                          className="text-muted-foreground"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold">Shortcuts</div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-1">
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px] font-mono leading-none">
                              ^G
                            </kbd>
                            <span>Group</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px] font-mono leading-none">
                              F
                            </kbd>
                            <span>Fit</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px] font-mono leading-none">
                              Del
                            </kbd>
                            <span>Delete</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px] font-mono leading-none">
                              ^Z
                            </kbd>
                            <span>Undo</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground col-span-2">
                            <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px] font-mono leading-none">
                              ^Y
                            </kbd>
                            <span>Redo (or ^⇧Z)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-muted/50 rounded-lg shrink-0">
                        <IconClick size={14} className="text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold">Editing</div>
                        <div className="text-[10px] text-muted-foreground leading-relaxed">
                          <span className="block font-medium text-foreground/80">
                            Double-click
                          </span>{" "}
                          Edit node or edge
                          <span className="block font-medium text-foreground/80 mt-1">
                            Drag Handles
                          </span>{" "}
                          Connect nodes
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/40">
                    <Button
                      onClick={toggleHint}
                      variant="outline"
                      size="sm"
                      className="w-full text-xs rounded-lg"
                    >
                      Hide for now
                    </Button>
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
                      "h-12 w-12 rounded-full shadow-2xl bg-card/90 backdrop-blur-md border border-border/60 hover:bg-muted transition-all cursor-pointer",
                      showHint &&
                        "border-primary/50 text-primary bg-primary/10",
                    )}
                  >
                    <IconInfoCircle size={18} stroke={1.5} />
                  </Button>
                }
              />
              <TooltipContent side="top">Navigation Tips</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}
    </>
  );
}
