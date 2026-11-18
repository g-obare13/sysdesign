/**
 * @fileoverview Left floating Nordic studio panel housing brand, project selector,
 * component search, mode switch, and draggable architecture & C4 registry.
 */

import * as React from "react";
import * as TablerIcons from "@tabler/icons-react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { REGISTRY } from "@/data/registry";
import { CATEGORY_STYLE } from "@/types/diagram";
import type { NodeCategory, NodeTemplate } from "@/types/diagram";

import {
  createProject,
  setActiveProject,
  useProjectStore,
} from "@/store/project.store";
import type { ProjectType } from "@/store/project.store";
import { setDiagramMode, useCanvasStore } from "@/store/canvas.store";
import { useAIKeys } from "@/store/ai.store";
import AIPanel from "@/components/ai/AIPanel";
import ProjectSetupPopup from "@/components/dashboard/ProjectSetupPopup";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type TablerIcon = React.FC<{
  size?: number;
  stroke?: number;
  color?: string;
  className?: string;
}>;

function getIcon(name: string): TablerIcon {
  const icons = TablerIcons as Record<string, unknown>;
  return (icons[name] as TablerIcon) ?? TablerIcons.IconBox;
}

const CATEGORY_ORDER: Array<NodeCategory> = [
  "microservice",
  "cloud",
  "database",
  "frontend",
  "networking",
  "security",
  "observability",
  "ai",
  "devops",
  "flow",
  "shape",
  "c4",
];

/**
 * Monochrome draggable component row in the sidebar.
 */
function NodeItem({
  template,
  isCustom = false,
  disabled = false,
}: {
  template: NodeTemplate;
  isCustom?: boolean;
  disabled?: boolean;
}) {
  const Icon = isCustom ? null : getIcon(template.icon);

  const onDragStart = (e: React.DragEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("application/sysdesign", JSON.stringify(template));
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={cn(
        "flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-grab select-none transition-colors group hover:bg-muted/80 active:cursor-grabbing",
        disabled && "opacity-30 cursor-not-allowed grayscale",
      )}
    >
      <div className="size-7 rounded-lg bg-muted/70 group-hover:bg-card flex items-center justify-center shrink-0 text-foreground/75 transition-colors">
        {Icon && <Icon size={15} stroke={1.6} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-foreground/90 truncate leading-tight">
          {template.label}
        </div>
        {template.description && (
          <div className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
            {template.description}
          </div>
        )}
      </div>
    </div>
  );
}

type TabId =
  | "components"
  | "c4"
  | "templates"
  | "integrations"
  | "flows"
  | "shapes"
  | "settings";

/**
 * Floating left Nordic studio panel with brand, project switcher, search, and component library.
 */
export default function Sidebar() {
  const navigate = useNavigate();
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const projects = useProjectStore((s) => s.projects);
  const activeProject = projects.find((p) => p.id === activeProjectId);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const saveStatus = useCanvasStore((s) => s.saveStatus);
  const diagramMode = useCanvasStore((s) => s.diagramMode);

  const canDrag = !!activeProjectId || projects.length === 0;

  const location = useLocation();
  const currentPath = location.pathname;

  let activeTab: TabId = "components";
  if (currentPath === "/integrations") activeTab = "integrations";
  else if (currentPath === "/flows") activeTab = "flows";
  else if (currentPath === "/shapes") activeTab = "shapes";
  else if (currentPath.endsWith("/c4") || diagramMode === "c4")
    activeTab = "c4";
  else if (currentPath === "/templates") activeTab = "templates";

  const { hasAny: hasAIKey } = useAIKeys();
  const [showAIPanel, setShowAIPanel] = React.useState(false);
  const [createProjectModalOpen, setCreateProjectModalOpen] =
    React.useState(false);
  const aiPanelRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setShowAIPanel(false);
  }, [activeProjectId]);

  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [expanded, setExpanded] = React.useState<Record<NodeCategory, boolean>>(
    {
      microservice: true,
      cloud: false,
      database: false,
      frontend: false,
      networking: false,
      security: false,
      observability: false,
      ai: false,
      devops: false,
      flow: false,
      shape: false,
      c4: false,
    },
  );

  const [searchQuery, setSearchQuery] = React.useState("");

  // ⌘K / Ctrl+K focuses component search
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCollapsed(false);
        setTimeout(() => searchInputRef.current?.focus(), 40);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filteredGrouped = React.useMemo(() => {
    const items: Record<NodeCategory, Array<NodeTemplate>> = {
      microservice: [],
      cloud: [],
      database: [],
      frontend: [],
      networking: [],
      security: [],
      observability: [],
      ai: [],
      devops: [],
      flow: [],
      shape: [],
      c4: [],
    };

    const query = searchQuery.toLowerCase().trim();

    REGISTRY.forEach((t) => {
      const matches =
        !query ||
        t.label.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query);

      if (matches) {
        items[t.category].push(t);
      }
    });

    Object.keys(items).forEach((cat) => {
      items[cat as NodeCategory].sort((a, b) => a.label.localeCompare(b.label));
    });
    return items;
  }, [searchQuery]);

  React.useEffect(() => {
    if (searchQuery.trim()) {
      const newExpanded = { ...expanded };
      let changed = false;
      Object.entries(filteredGrouped).forEach(([cat, items]) => {
        if (items.length > 0 && !newExpanded[cat as NodeCategory]) {
          newExpanded[cat as NodeCategory] = true;
          changed = true;
        }
      });
      if (changed) {
        setExpanded(newExpanded);
      }
    }
  }, [searchQuery, filteredGrouped]);

  const handleCreateNewProject = (
    name: string,
    type: ProjectType = "design",
    description?: string,
  ) => {
    const newProject = createProject(name, type, description);
    if (!newProject) return;
    setCreateProjectModalOpen(false);
    navigate({
      to: type === "c4" ? "/$slug/c4" : "/$slug",
      params: { slug: newProject.slug } as any,
    });
  };

  const handleModeSwitch = (mode: "architecture" | "c4") => {
    setDiagramMode(mode);
    if (activeProject) {
      navigate({
        to: mode === "c4" ? "/$slug/c4" : "/$slug",
        params: { slug: activeProject.slug } as any,
      });
    }
  };

  const isExporting = useCanvasStore((s) => s.isExporting);
  if (isExporting) return null;

  const statusText =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "saved"
        ? "Saved"
        : saveStatus === "error"
          ? "Save failed"
          : `${nodes.length} nodes · ${edges.length} edges`;

  return (
    <div className="select-none z-30">
      <ProjectSetupPopup
        open={createProjectModalOpen}
        onClose={() => setCreateProjectModalOpen(false)}
        onCreate={handleCreateNewProject}
      />

      {/* Compact Floating Pill when Collapsed */}
      {isCollapsed && (
        <div className="fixed top-3 left-3 z-40 flex items-center gap-1.5 p-1.5 pr-2.5 nordic-pill rounded-2xl animate-in fade-in duration-150">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsCollapsed(false)}
            className="size-8 rounded-xl text-foreground/80 hover:text-foreground hover:bg-muted"
            title="Expand Sidebar"
          >
            <TablerIcons.IconLayoutSidebar size={16} stroke={1.6} />
          </Button>
          <div className="w-px h-4 bg-border" />
          <span className="text-[13px] font-medium text-foreground truncate max-w-36 pl-1">
            {activeProject ? activeProject.name : "Scratchpad"}
          </span>
        </div>
      )}

      {/* Sculpted Left Floating Studio Panel */}
      <aside
        className={cn(
          "fixed top-3 left-3 bottom-3 w-[260px] rounded-[20px] nordic-panel flex flex-col overflow-hidden transition-all duration-200 z-40",
          isCollapsed
            ? "-translate-x-72 opacity-0 pointer-events-none"
            : "translate-x-0 opacity-100",
        )}
      >
        {/* Top Row: Brand + Collapse */}
        <div className="shrink-0 px-4 pt-3.5 pb-2 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-3.5 w-auto text-foreground" />
            <span className="sr-only">SysDesign</span>
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsCollapsed(true)}
            className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Collapse Sidebar"
          >
            <TablerIcons.IconLayoutSidebarLeftCollapse size={16} stroke={1.6} />
          </Button>
        </div>

        {/* Project Selector + Metadata Subtitle */}
        <div className="shrink-0 px-3 pb-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full flex flex-col items-start px-2 py-1.5 rounded-xl hover:bg-muted/70 transition-colors cursor-pointer outline-none text-left group">
              <div className="w-full flex items-center justify-between gap-2">
                <span className="text-[14px] font-semibold text-foreground tracking-tight truncate">
                  {activeProject ? activeProject.name : "Untitled Project"}
                </span>
                <TablerIcons.IconChevronDown
                  size={14}
                  stroke={1.7}
                  className="text-muted-foreground group-hover:text-foreground shrink-0 transition-colors"
                />
              </div>
              <span
                className={cn(
                  "text-[11.5px] truncate mt-0.5 tabular-nums",
                  saveStatus === "error"
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {activeTab === "c4" ? "C4 Model" : "System Design"} ·{" "}
                {statusText}
              </span>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              sideOffset={6}
              className="w-60 rounded-2xl p-1.5 shadow-xl border border-black/[0.06] dark:border-white/[0.08]"
            >
              <DropdownMenuLabel className="px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground">
                Projects
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar">
                {projects.map((p) => (
                  <DropdownMenuItem
                    key={p.id}
                    onClick={() => {
                      setActiveProject(p.id);
                      navigate({
                        to: p.type === "c4" ? "/$slug/c4" : "/$slug",
                        params: { slug: p.slug } as any,
                      });
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-[12.5px] cursor-pointer",
                      p.id === activeProjectId && "bg-muted font-medium",
                    )}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-foreground">{p.name}</span>
                      <span className="text-[10.5px] text-muted-foreground truncate">
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {p.id === activeProjectId && (
                      <TablerIcons.IconCheck
                        size={14}
                        className="text-foreground shrink-0"
                      />
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setCreateProjectModalOpen(true)}
                className="w-full flex items-center justify-start px-2.5 py-2 gap-2 text-[12.5px] font-medium text-foreground hover:bg-muted rounded-xl cursor-pointer"
              >
                <TablerIcons.IconFolderPlus size={15} stroke={1.6} />
                <span>New Project</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate({ to: "/projects" })}
                className="w-full flex items-center justify-start px-2.5 py-2 gap-2 text-[12.5px] text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl cursor-pointer"
              >
                <TablerIcons.IconLayoutGrid size={15} stroke={1.6} />
                <span>All Projects</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search Input (directly below project name) */}
          <div className="relative mt-2 px-1">
            <Input
              ref={searchInputRef}
              type="text"
              size="sm"
              placeholder="Search…"
              leftIcon={<TablerIcons.IconSearch size={14} stroke={1.6} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 rounded-xl bg-muted/75 border-transparent text-[12.5px] placeholder:text-muted-foreground/80 pr-11"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-md cursor-pointer"
              >
                <TablerIcons.IconX size={13} />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-card/90 border border-border rounded-md">
                ⌘K
              </kbd>
            )}
          </div>

          {/* Recessed Segmented Switch (Architecture | C4) */}
          <div className="mt-3 px-1">
            <div className="grid grid-cols-2 p-1 rounded-xl bg-muted/85">
              <button
                type="button"
                onClick={() => handleModeSwitch("architecture")}
                className={cn(
                  "h-7 rounded-lg text-[12px] font-medium transition-all cursor-pointer select-none",
                  activeTab !== "c4"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Architecture
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch("c4")}
                className={cn(
                  "h-7 rounded-lg text-[12px] font-medium transition-all cursor-pointer select-none",
                  activeTab === "c4"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                C4 Model
              </button>
            </div>
          </div>
        </div>

        <div className="h-px bg-border/60 mx-3 shrink-0" />

        {/* Scrollable Monochrome Component List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2.5 custom-scrollbar space-y-1">
          {activeTab === "c4" ? (
            <div className="flex flex-col gap-0.5">
              {[
                {
                  subtype: "c4-person",
                  label: "Person",
                  desc: "User, actor, or persona",
                  icon: "IconUser",
                },
                {
                  subtype: "c4-software-system",
                  label: "Software System",
                  desc: "Top-level system boundary",
                  icon: "IconBox",
                },
                {
                  subtype: "c4-container",
                  label: "Container",
                  desc: "Apps, services & databases",
                  icon: "IconServer",
                },
                {
                  subtype: "c4-component",
                  label: "Component",
                  desc: "Internal modular building block",
                  icon: "IconComponents",
                },
              ].map((item) => (
                <NodeItem
                  key={item.subtype}
                  disabled={!canDrag}
                  template={{
                    subtype: item.subtype,
                    label: item.label,
                    category: "c4",
                    icon: item.icon,
                    description: item.desc,
                  }}
                />
              ))}
            </div>
          ) : (
            <Accordion
              multiple
              value={CATEGORY_ORDER.filter((cat) => expanded[cat])}
              onValueChange={(val) => {
                const selected = new Set(val as Array<string>);
                setExpanded((prev) => {
                  const next = { ...prev };
                  CATEGORY_ORDER.forEach((cat) => {
                    next[cat] = selected.has(cat);
                  });
                  return next;
                });
              }}
              className="w-full space-y-0.5"
            >
              {CATEGORY_ORDER.map((cat) => {
                const rawTemplates = filteredGrouped[cat] || [];
                if (rawTemplates.length === 0) return null;
                const templates = rawTemplates
                  .slice()
                  .sort((a, b) => a.label.localeCompare(b.label));
                const style = CATEGORY_STYLE[cat];

                return (
                  <AccordionItem key={cat} value={cat} className="border-none">
                    <AccordionTrigger className="w-full py-2 px-2.5 hover:bg-muted/70 rounded-xl">
                      <span className="text-[12.5px] font-medium text-foreground/85 truncate">
                        {style?.label || cat}
                      </span>
                      <span className="text-[11px] text-muted-foreground ml-auto mr-2 tabular-nums">
                        {templates.length}
                      </span>
                    </AccordionTrigger>

                    <AccordionContent className="pt-0.5 pb-1.5">
                      <div className="flex flex-col gap-0.5">
                        {templates.map((template) => (
                          <NodeItem
                            key={template.subtype}
                            template={template}
                            disabled={!canDrag}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      </aside>

      {/* Floating AI Panel */}
      {showAIPanel && hasAIKey && (
        <div
          ref={aiPanelRef}
          className="fixed top-16 left-[284px] z-50 animate-in fade-in slide-in-from-left-2 duration-150"
        >
          <AIPanel onClose={() => setShowAIPanel(false)} />
        </div>
      )}
    </div>
  );
}
