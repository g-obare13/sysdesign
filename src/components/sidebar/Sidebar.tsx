/**
 * @fileoverview Left component palette drawer allowing users to search and drag architecture & C4 items onto the canvas.
 */

import * as React from "react";
import * as TablerIcons from "@tabler/icons-react";
import { REGISTRY } from "@/data/registry";
import {
  CATEGORY_STYLE
  
  
} from "@/types/diagram";
import type {NodeCategory, NodeTemplate} from "@/types/diagram";

import { useProjectStore } from "@/store/project.store";
import { useCanvasStore } from "@/store/canvas.store";
import { useAIKeys } from "@/store/ai.store";
import AIPanel from "@/components/ai/AIPanel";
import { getC4Style } from "@/components/canvas/DiagramNode";
import { cn } from "@/lib/utils";
import { useLocation } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  "ai",
  "cloud",
  "database",
  "devops",
  "frontend",
  "flow",
  "microservice",
  "networking",
  "observability",
  "security",
  "shape",
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
  const Icon = isCustom ? null : getIcon(template.icon);
  const categoryStyle =
    CATEGORY_STYLE[template.category] || CATEGORY_STYLE.microservice;
  const isC4 = template.category === "c4";
  const c4Style = isC4 ? getC4Style(template.subtype) : null;
  const iconColor = c4Style?.color || categoryStyle?.color || "#59634b";
  const iconBg = c4Style?.pill || categoryStyle?.pill || "#f1f3ec";

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
        "flex items-center gap-2 px-2 py-1.5 rounded-xs cursor-grab select-none transition-colors group border border-transparent hover:border-border/70 hover:bg-muted/50",
        disabled && "opacity-30 cursor-not-allowed filter grayscale",
      )}
    >
      <div
        className="size-6 rounded-full flex items-center justify-center shrink-0"
        style={{
          backgroundColor: iconBg,
          color: iconColor,
        }}
      >
        {Icon && <Icon size={13} stroke={2} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-medium text-foreground  truncate">
          {template.label}
        </div>
        <div className="text-[10px] text-muted-foreground  truncate">
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
 *
 * @returns Sidebar component palette element
 */
export default function Sidebar() {
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const projects = useProjectStore((s) => s.projects);

  const canDrag = !!activeProjectId || projects.length === 0;

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

  const isExporting = useCanvasStore((s) => s.isExporting);
  if (isExporting) return null;

  return (
    <div className="select-none z-30">
      {/* Floating Toggle Button when Collapsed */}
      {isCollapsed && (
        <Button
          variant="outline"
          size="sm"
          icon={
            <TablerIcons.IconLayoutSidebar size={14} className="text-primary" />
          }
          iconPlacement="left"
          onClick={() => setIsCollapsed(false)}
          className="absolute top-3 left-3 z-40 bg-card/95 backdrop-blur-xs shadow-xs text-xs font-medium"
        >
          Palette
        </Button>
      )}

      {/* Main Component Palette Tool Window */}
      <aside
        className={cn(
          "absolute top-3 left-3 bottom-3 w-62.5 rounded-md bg-card border border-border shadow-xs flex flex-col overflow-hidden transition-all duration-200 z-30",
          isCollapsed
            ? "-translate-x-70 opacity-0 pointer-events-none"
            : "translate-x-0 opacity-100",
        )}
      >
        {/* Panel Header */}
        <div className="shrink-0 p-2.5 border-b border-border/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-primary" />
              <h6 className="text-xs font-semibold text-foreground tracking-tight">
                {activeTab === "components"
                  ? "Architecture Nodes"
                  : activeTab === "c4"
                    ? "C4 Components"
                    : activeTab === "shapes"
                      ? "Technical Shapes"
                      : "Palette"}
              </h6>
            </div>
            <Button
              variant="ghost"
              size="icon"
              icon={<TablerIcons.IconChevronLeft size={14} />}
              onClick={() => setIsCollapsed(true)}
              className="size-6 text-muted-foreground hover:text-foreground"
              title="Collapse Palette"
            />
          </div>

          {/* Search Input */}
          <div className="relative">
            <Input
              type="text"
              size="lg"
              placeholder="Search components…"
              leftIcon={<TablerIcons.IconSearch size={12} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs placeholder:text-[11px]"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                icon={<TablerIcons.IconX size={11} />}
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 size-5 text-muted-foreground hover:text-foreground p-0"
              />
            )}
          </div>
        </div>

        {/* Scrollable Node Categories */}
        <div className="flex-1 overflow-y-auto p-1.5 custom-scrollbar space-y-1">
          {activeTab === "c4" ? (
            <div className="flex flex-col py-0.5 gap-0.5">
              <div className="px-2 pb-1.5">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  C4 abstractions — Person, Software System, Container, and
                  Component.
                </p>
              </div>
              {[
                {
                  subtype: "c4-person",
                  label: "Person",
                  desc: "User, actor, or persona interacting with system",
                  icon: "IconUser",
                },
                {
                  subtype: "c4-software-system",
                  label: "Software System",
                  desc: "Top-level software system boundary",
                  icon: "IconBox",
                },
                {
                  subtype: "c4-container",
                  label: "Container",
                  desc: "Executables, microservices, databases",
                  icon: "IconServer",
                },
                {
                  subtype: "c4-component",
                  label: "Component",
                  desc: "Internal modular component or module",
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
                    <AccordionTrigger className="w-full py-1.5 px-2 hover:bg-muted/60 rounded-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: style?.color || "#59634b" }}
                        />
                        <span className="text-xs font-semibold text-foreground truncate">
                          {style?.label || cat}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-foreground px-1.5 py-0.5 rounded-full bg-muted border border-border/40 ml-auto mr-1.5">
                        {templates.length}
                      </span>
                    </AccordionTrigger>

                    <AccordionContent className="pt-0.5 pb-1">
                      <div className="flex flex-col pl-1.5 gap-0.5">
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

        {/* Panel Footer Metadata */}
        <div className="shrink-0 p-2 border-t border-border/60 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "size-1.5 rounded-full",
                canDrag ? "bg-primary" : "bg-muted-foreground/50",
              )}
            />
            <span className="text-[10px] font-mono text-muted-foreground">
              {canDrag ? "Canvas ready" : "Read-only"}
            </span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground/70">
            v0.0.3
          </span>
        </div>
      </aside>

      {/* Floating AI Panel */}
      {showAIPanel && hasAIKey && (
        <div
          ref={aiPanelRef}
          className="absolute top-16 left-[270px] z-50 animate-in fade-in slide-in-from-left-2 duration-150"
        >
          <AIPanel onClose={() => setShowAIPanel(false)} />
        </div>
      )}
    </div>
  );
}
