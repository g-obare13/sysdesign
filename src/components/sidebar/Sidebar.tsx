import * as React from "react";
import * as TablerIcons from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { REGISTRY } from "../../data/registry";
import {
  CATEGORY_STYLE,
  type NodeCategory,
  type NodeTemplate,
} from "../../types/diagram";

import { useProjectStore } from "../../store/project.store";
import { useCanvasStore } from "../../store/canvas.store";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate, useLocation } from "@tanstack/react-router";
import ConfirmModal from "../ui/ConfirmModal";
import { setDiagramMode, clearCanvas } from "../../store/canvas.store";
import { setPrompt as setAIPrompt, useAIKeys } from "../../store/ai.store";
import AIPanel from "../ai/AIPanel";
import AISettings from "../ai/AISettings";

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

const CATEGORY_ORDER: NodeCategory[] = [
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
  "c4",
];

/**
 * Draggable item in the sidebar representing a system component.
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  const style = CATEGORY_STYLE[template.category];
  const accent = (isDark && style?.dark?.color) || style?.color || "#888888";
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
        "flex items-center gap-2.5 px-3 py-2 mx-1 rounded-2xl cursor-grab select-none transition-colors duration-100 group border border-transparent hover:border-border/40",
        disabled
          ? "opacity-40 cursor-not-allowed filter grayscale-[0.5]"
          : "hover:bg-muted/60",
      )}
    >
      <div
        className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border border-border/50"
        style={{
          background: `color-mix(in srgb, ${accent} 12%, var(--card))`,
        }}
      >
        {Icon && <Icon size={14} stroke={1.5} color={accent} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-medium text-foreground leading-tight truncate">
          {template.label}
        </div>
        <div className="text-[10px] text-muted-foreground leading-tight truncate">
          {template.description}
        </div>
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
 * Left component palette drawer with searchable node registry.
 */
export default function Sidebar() {
  const navigate = useNavigate();
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const projects = useProjectStore((s) => s.projects);
  const activeProject = projects.find((p) => p.id === activeProjectId);

  const canDrag = !!activeProjectId || projects.length === 0;

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const diagramMode = useCanvasStore((s) => s.diagramMode);

  const location = useLocation();
  const currentPath = location.pathname;

  let activeTab: TabId = "components";
  if (currentPath === "/integrations") activeTab = "integrations";
  else if (currentPath === "/flows") activeTab = "flows";
  else if (currentPath === "/shapes") activeTab = "shapes";
  else if (currentPath.endsWith("/c4")) activeTab = "c4";
  else if (currentPath === "/templates") activeTab = "templates";

  const { hasAny: hasAIKey } = useAIKeys();
  const [showAIPanel, setShowAIPanel] = React.useState(false);
  const aiPanelRef = React.useRef<HTMLDivElement>(null);

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

  const toggleCategory = (cat: NodeCategory) => {
    setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const filteredGrouped = React.useMemo(() => {
    const items: Record<NodeCategory, NodeTemplate[]> = {
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

  const isExporting = useCanvasStore((s) => s.isExporting);
  if (isExporting) return null;

  return (
    <div className="select-none z-30">
      {/* Floating Toggle Button when Collapsed */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="absolute top-4 left-4 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full bg-card/90 backdrop-blur-md border border-border/80 shadow-lg hover:bg-muted font-sans font-bold transition-all"
        >
          <TablerIcons.IconLayoutSidebar size={16} className="text-primary" />
          <span>Palette</span>
        </button>
      )}

      {/* Main Component Palette Panel (Floating Studio Panel) */}
      <aside
        className={cn(
          "absolute top-4 left-4 bottom-4 w-[280px] rounded-3xl bg-card/90 backdrop-blur-xl border border-border/80 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out z-30",
          isCollapsed
            ? "-translate-x-[320px] opacity-0 pointer-events-none"
            : "translate-x-0 opacity-100",
        )}
      >
        {/* Panel Header */}
        <div className="shrink-0 px-4 py-3 border-b border-border/50">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary" />
              <h2 className="text-[13px] font-bold text-foreground tracking-tight">
                {activeTab === "components"
                  ? "Architecture Nodes"
                  : activeTab === "c4"
                    ? "C4 Components"
                    : activeTab === "shapes"
                      ? "Technical Shapes"
                      : "Palette"}
              </h2>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              title="Collapse Panel"
            >
              <TablerIcons.IconChevronLeft size={16} />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative group">
            <TablerIcons.IconSearch
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
            />
            <input
              type="text"
              placeholder="Search nodes & shapes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-7 bg-muted/50 border border-border/40 rounded-full text-[11px] placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              >
                <TablerIcons.IconX size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Node Categories */}
        <div className="flex-1 overflow-y-auto py-2 px-1 custom-scrollbar">
          {activeTab === "c4" ? (
            <div className="flex flex-col py-1 gap-1">
              <div className="px-3 pb-2">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  C4 Model abstractions — Person, Software System, Container, and Component.
                </p>
              </div>
              {[
                {
                  subtype: "c4-person",
                  label: "Person",
                  desc: "User, actor, or persona interacting with system",
                  icon: "IconUser",
                  color: "#3B82F6",
                },
                {
                  subtype: "c4-software-system",
                  label: "Software System",
                  desc: "Top-level software system boundary",
                  icon: "IconBox",
                  color: "#10B981",
                },
                {
                  subtype: "c4-container",
                  label: "Container",
                  desc: "Executables, microservices, applications, database",
                  icon: "IconServer",
                  color: "#8B5CF6",
                },
                {
                  subtype: "c4-component",
                  label: "Component",
                  desc: "Internal modular component or module",
                  icon: "IconComponents",
                  color: "#F59E0B",
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
            CATEGORY_ORDER.map((cat) => {
              const templates = filteredGrouped[cat] || [];
              if (templates.length === 0) return null;
              const isExpanded = expanded[cat];
              const style = CATEGORY_STYLE[cat];

              return (
                <div key={cat} className="mb-1">
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left hover:bg-muted/40 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: style?.color ?? "#888888" }}
                      />
                      <span className="text-xs font-bold capitalize text-foreground/90">
                        {cat}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold bg-muted/60 px-1.5 py-0.2 rounded-full">
                        {templates.length}
                      </span>
                    </div>
                    <TablerIcons.IconChevronDown
                      size={14}
                      className={cn(
                        "text-muted-foreground transition-transform duration-200",
                        isExpanded && "rotate-180",
                      )}
                    />
                  </button>

                  {isExpanded && (
                    <div className="mt-1 space-y-0.5 pl-1">
                      {templates.map((tpl) => (
                        <NodeItem
                          key={tpl.subtype}
                          template={tpl}
                          disabled={!canDrag}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Custom Node Palette Footer */}
        {activeTab === "components" && (
          <div className="shrink-0 p-2 border-t border-border/40 bg-muted/20 rounded-b-2xl">
            <NodeItem
              isCustom
              disabled={!canDrag}
              template={{
                subtype: `custom-node-${Date.now()}`,
                label: "Custom Node",
                category: "cloud",
                icon: "IconBox",
                description: "Drag generic block onto canvas",
              }}
            />
          </div>
        )}
      </aside>

      {/* Floating AI Panel */}
      {showAIPanel && hasAIKey && (
        <div
          ref={aiPanelRef}
          className="fixed z-50"
          style={{
            left: isCollapsed ? 16 : 286,
            top: "50%",
            transform: "translateY(-50%)",
            maxHeight: "calc(100vh - 64px)",
          }}
        >
          <AIPanel onClose={() => setShowAIPanel(false)} />
        </div>
      )}
    </div>
  );
}
