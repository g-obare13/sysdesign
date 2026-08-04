import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useReactFlow } from "@xyflow/react";
import { useEffect, useRef, useState } from "react";

import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconAlertTriangle,
  IconBook,
  IconCheck,
  IconChevronDown,
  IconFocus2,
  IconFolder,
  IconGridDots,
  IconLogout,
  IconSitemap,
  IconSquarePlus,
  IconTrash,
  IconUserCircle,
  IconZoomIn,
  IconZoomOut,
} from "@tabler/icons-react";
import { type Template } from "../../data/templates";
import {
  clearCanvas,
  autoLayout,
  loadTemplate,
  redo,
  setExportingState,
  toggleSnap,
  undo,
  useCanvasStore,
} from "../../store/canvas.store";
import {
  login,
  logout,
  setActiveProject,
  useProjectStore,
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
import { Logo } from "../ui/logo";
import { cn } from "#/lib/utils";

const EXPORT_OPTIONS = [
  { key: "png", label: "PNG image", desc: "Raster, 2× resolution" },
  { key: "svg", label: "SVG image", desc: "Vector, infinitely scalable" },
  { key: "mermaid", label: "Mermaid", desc: "Diagram-as-code (.mmd)" },
  { key: "terraform", label: "Terraform", desc: "HCL scaffold (main.tf)" },
  { key: "dsl", label: "Structurizr", desc: "C4 architecture (.dsl)" },
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

  const user = useProjectStore((s) => s.user);
  const loading = useProjectStore((s) => s.loading);
  const migrating = useProjectStore((s) => s.migrating);

  const location = useLocation();
  const navigate = useNavigate();
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const [exportOpen, setExportOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [templateConfirm, setTemplateConfirm] = useState<Template | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const hasLocalProjects = useProjectStore(
    (s) => s.projects.length > 0 && !s.user,
  );

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

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyLen - 1;
  const hasNodes = nodes.length > 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }

      const pMenu = document.getElementById("project-menu");
      const pBtn = document.getElementById("project-btn");
      if (
        pMenu &&
        !pMenu.contains(e.target as Node) &&
        pBtn &&
        !pBtn.contains(e.target as Node)
      ) {
        setProjectMenuOpen(false);
      }

      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLoadTemplate = (tpl: Template) => {
    loadTemplate(tpl);
    setTemplateConfirm(null);
  };

  const handleExport = async (key: string) => {
    setExporting(key);
    setExportOpen(false);

    // Set exporting state to true to hide UI components
    setExportingState(true);

    // Small delay to ensure React state change reflects in the DOM
    await new Promise((r) => setTimeout(r, 100));

    try {
      if (key === "png") await exportPng();
      else if (key === "svg") await exportSvgFile();
      else if (key === "mermaid") exportMermaid(nodes, edges);
      else if (key === "terraform") exportTerraform(nodes, edges);
      else if (key === "dsl") exportStructurizr(nodes, edges);
    } finally {
      setExportingState(false);
      setExporting(null);
    }
  };

  return (
    <>
      <header
        className={cn(
          "h-12 flex items-center justify-between px-4 border-b bg-background shrink-0 relative z-50 transition-all",
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

        {/* Left — brand + stats */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 relative">
            <Logo className="h-6 w-auto" />
            <h1 className="sr-only">SysDesign — Systems Architecture</h1>
          </Link>

          <Link
            to="/projects"
            className="flex items-center gap-1.5 px-2 py-1 rounded-[--radius] text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all select-none"
          >
            <IconFolder size={14} stroke={1.8} />
            Projects
          </Link>

          <Link
            to="/templates"
            className="flex items-center gap-1.5 px-2 py-1 rounded-[--radius] text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all select-none"
          >
            <IconBook size={14} stroke={1.8} className="text-primary" />
            Templates
          </Link>

          {/* Project Selector Dropdown */}
          <div className="relative flex items-center">
            <Button
              variant={"outline"}
              icon={
                <IconChevronDown
                  className={`transition-transform duration-200 ${projectMenuOpen ? "rotate-180" : ""}`}
                />
              }
              iconSide="right"
              onClick={() => setProjectMenuOpen(!projectMenuOpen)}
            >
              {activeProject ? activeProject.name : "Select Project"}
            </Button>

            {projectMenuOpen && (
              <div
                id="project-menu"
                className="absolute top-[calc(100%+6px)] left-0 z-50 bg-card border border-border
                           rounded-[--radius] p-1 min-w-50 shadow-xl animate-in fade-in slide-in-from-top-1"
              >
                <div className="px-3 py-1.5 border-b border-border mb-1">
                  <span className="flex items-center gap-1.5 px-2 py-1 rounded-[--radius] text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all select-none">
                    Switch Project
                  </span>
                </div>
                <div className="max-h-75 overflow-y-auto">
                  {projects.map((p) => (
                    <Button
                      key={p.id}
                      variant="ghost"
                      onClick={() => {
                        setActiveProject(p.id);
                        setProjectMenuOpen(false);
                        navigate({ to: "/$slug", params: { slug: p.slug } });
                      }}
                      className={`w-full justify-start px-3 py-2 h-auto text-left gap-2 rounded-none ${p.id === activeProjectId ? "bg-primary/10 text-primary" : ""}`}
                    >
                      <IconFolder
                        size={14}
                        className={
                          p.id === activeProjectId
                            ? "text-primary"
                            : "text-muted-foreground"
                        }
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[12.5px] font-medium truncate">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {new Date(p.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
                <div className="mt-1 pt-1 border-t border-border">
                  <Button
                    onClick={() => {
                      setProjectMenuOpen(false);
                      navigate({ to: "/projects" });
                    }}
                    variant="ghost"
                    className="w-full justify-start px-3 py-2 h-auto text-left gap-2 text-primary hover:bg-primary/5 rounded-none"
                  >
                    <IconSquarePlus size={14} />
                    <span className="text-[12px] font-medium">
                      All Projects
                    </span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          <span className="text-border mx-1 opacity-50">|</span>
          <span
            className={`text-[11.5px] text-muted-foreground transition-opacity ${isCanvasRoute ? "opacity-100" : "opacity-0"}`}
          >
            {nodes.length} nodes · {edges.length} edges
          </span>

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

        {/* Right — Global Actions */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <div ref={userMenuRef} className="relative ml-1">
            {user ? (
              <Button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                variant="outline"
                size="icon-sm"
                className="rounded-full overflow-hidden border-2 border-primary/20 p-0"
                title={user.email}
              >
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <IconUserCircle size={18} />
                )}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                {hasLocalProjects && (
                  <span className="text-[10px] text-muted-foreground mr-1 hidden sm:inline-block bg-muted/50 px-2 py-0.5 rounded-full whitespace-nowrap">
                    Local work will be synced
                  </span>
                )}
                <Button
                  onClick={login}
                  disabled={loading || migrating}
                  variant="outline"
                  size="sm"
                  icon={
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
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
                  className="gap-1.5 pl-2 pr-3"
                >
                  {migrating
                    ? "Migrating…"
                    : loading
                      ? "Signing in…"
                      : "Sign in"}
                </Button>
              </div>
            )}

            {userMenuOpen && user && (
              <div
                className="absolute top-[calc(100%+6px)] right-0 z-500 bg-card border border-border
                             rounded-[--radius] p-1 min-w-50 shadow-lg shadow-black/10"
              >
                <div className="px-3 py-2 border-b border-border/50 mb-1">
                  <p className="text-[12px] font-semibold truncate">
                    {user.user_metadata?.full_name || "User"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    logout();
                    setUserMenuOpen(false);
                  }}
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 px-3 py-2 h-auto"
                >
                  <IconLogout size={14} className="mr-2" />
                  <span className="text-[12.5px] font-medium">Logout</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Floating Bottom Toolbar — Design System Center Dock */}
      {isCanvasRoute && !isExporting && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-1 p-1 bg-card border rounded-[--radius] shadow-xl">
            {/* History Dock */}
            <div className="flex items-center gap-0.5">
              <Button
                onClick={undo}
                disabled={!canUndo}
                variant="ghost"
                size="icon-sm"
                className="h-9 w-9 rounded-[--radius] hover:bg-muted transition-colors disabled:opacity-30"
                title="Undo (⌘Z)"
              >
                <IconArrowBackUp size={18} stroke={1.5} />
              </Button>
              <Button
                onClick={redo}
                disabled={!canRedo}
                variant="ghost"
                size="icon-sm"
                className="h-9 w-9 rounded-[--radius] hover:bg-muted transition-colors disabled:opacity-30"
                title="Redo (⌘Y)"
              >
                <IconArrowForwardUp size={18} stroke={1.5} />
              </Button>
            </div>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Navigation Dock */}
            <div className="flex items-center gap-0.5">
              <Button
                onClick={() => zoomIn()}
                variant="ghost"
                size="icon-sm"
                className="h-9 w-9 rounded-[--radius] hover:bg-muted transition-colors"
                title="Zoom In (+)"
              >
                <IconZoomIn size={18} stroke={1.5} />
              </Button>
              <Button
                onClick={() => zoomOut()}
                variant="ghost"
                size="icon-sm"
                className="h-9 w-9 rounded-[--radius] hover:bg-muted transition-colors"
                title="Zoom Out (-)"
              >
                <IconZoomOut size={18} stroke={1.5} />
              </Button>
              <Button
                onClick={() => fitView({ duration: 450 })}
                variant="ghost"
                size="icon-sm"
                className="h-9 w-9 rounded-[--radius] hover:bg-muted transition-colors"
                title="Fit to Canvas"
              >
                <IconFocus2 size={18} stroke={1.5} />
              </Button>
              <Button
                onClick={() => {
                  autoLayout();
                  setTimeout(() => fitView({ duration: 450, padding: 0.2 }), 60);
                }}
                disabled={!hasNodes}
                variant="ghost"
                size="icon-sm"
                className="h-9 w-9 rounded-[--radius] hover:bg-muted transition-colors disabled:opacity-30"
                title="Auto Layout"
              >
                <IconSitemap size={18} stroke={1.5} />
              </Button>
            </div>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Utility Actions */}
            <div className="flex items-center gap-1">
              <Button
                icon={IconGridDots}
                onClick={toggleSnap}
                variant={snapToGrid ? "default" : "outline"}
                loading={loading}
                size="sm"
              />

              <div className="w-px h-6 bg-border mx-1" />

              <Button
                onClick={() => setClearConfirmOpen(true)}
                disabled={!hasNodes}
                icon={IconTrash}
                loading={loading}
                iconSide="left"
                variant="destructive"
                size="sm"
                className={
                  "text-destructive hover:bg-destructive/10 border-transparent hover:border-destructive/20"
                }
              >
                Clear
              </Button>
            </div>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Primary Action: Export */}
            <div ref={menuRef} className="relative">
              <Button
                onClick={() => setExportOpen((p) => !p)}
                disabled={!hasNodes}
                icon={IconChevronDown}
                loading={exporting ? true : false}
                iconSide="right"
                variant="default"
                size="sm"
              >
                Export
              </Button>

              {exportOpen && (
                <div className="absolute bottom-[calc(100%+12px)] right-0 z-50 bg-card border border-border rounded-[--radius] p-1 min-w-50 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="px-3 py-1.5 border-b border-border/50 mb-1">
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-[--radius] text-xs font-medium text-muted-foreground select-none">
                      Select Format
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {EXPORT_OPTIONS.map((opt) => (
                      <Button
                        key={opt.key}
                        onClick={() => handleExport(opt.key)}
                        variant="ghost"
                        className="w-full flex-col items-start px-3 py-2 h-auto text-left rounded-none hover:bg-muted"
                      >
                        <span className="flex items-center gap-1.5 text-xs font-medium text-foreground transition-all select-none">
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {opt.desc}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
