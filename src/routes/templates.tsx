/**
 * @fileoverview Architecture & C4 Template gallery route (`/templates`).
 */

import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  IconArrowUpRight,
  IconCheck,
  IconGitBranch,
  IconLayersSubtract,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import {
  ARCHITECTURE_TEMPLATES,
  C4_TEMPLATES,
  TEMPLATES,
} from "@/data/templates";
import type { Template } from "@/data/templates";
import {
  clearCanvas,
  loadTemplate,
  normalizeTemplateLayout,
} from "@/store/canvas.store";
import { useProjectStore } from "@/store/project.store";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Container from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/templates")({
  component: TemplatesPage,
});

/**
 * Computes a normalized SVG schematic of a template's actual node positions and edges.
 */
function BlueprintSchematic({ template }: { template: Template }) {
  const layout = useMemo(() => {
    const rawNodes = normalizeTemplateLayout(
      template.nodes,
      template.edges,
      template.category,
    );
    const nodes = rawNodes.filter((n) => n.type !== "group");
    if (nodes.length === 0) {
      return { boxes: [], lines: [] };
    }

    const parentPos = new Map<string, { x: number; y: number }>();
    for (const n of rawNodes) {
      if (!n.parentId) {
        parentPos.set(n.id, n.position);
      }
    }

    const absNodes = nodes.map((n) => {
      const parent = n.parentId ? parentPos.get(n.parentId) : undefined;
      return {
        node: n,
        x: (parent?.x ?? 0) + n.position.x,
        y: (parent?.y ?? 0) + n.position.y,
      };
    });

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const item of absNodes) {
      minX = Math.min(minX, item.x);
      minY = Math.min(minY, item.y);
      maxX = Math.max(maxX, item.x + 256);
      maxY = Math.max(maxY, item.y + 128);
    }

    const width = Math.max(maxX - minX, 1);
    const height = Math.max(maxY - minY, 1);
    const pad = 28;
    const vw = 460;
    const vh = 260;
    const scale = Math.min((vw - pad * 2) / width, (vh - pad * 2) / height);

    const offsetX = (vw - width * scale) / 2;
    const offsetY = (vh - height * scale) / 2;

    const byId = new Map<
      string,
      { cx: number; cy: number; x: number; y: number; w: number; h: number }
    >();

    const boxes = absNodes.map(({ node: n, x: absX, y: absY }) => {
      const x = offsetX + (absX - minX) * scale;
      const y = offsetY + (absY - minY) * scale;
      const w = Math.max(24, 240 * scale);
      const h = Math.max(12, 110 * scale);
      const rect = { cx: x + w / 2, cy: y + h / 2, x, y, w, h };
      byId.set(n.id, rect);
      return {
        id: n.id,
        label: n.data.label,
        category: n.data.category || "microservice",
        ...rect,
      };
    });

    const lines = template.edges
      .map((e) => {
        const src = byId.get(e.source);
        const tgt = byId.get(e.target);
        if (!src || !tgt) return null;
        return {
          id: e.id,
          x1: src.cx,
          y1: src.cy,
          x2: tgt.cx,
          y2: tgt.cy,
        };
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);

    return { boxes, lines };
  }, [template]);

  return (
    <div className="relative w-full aspect-[16/9] rounded-2xl bg-muted/45 border border-border overflow-hidden">
      <svg
        viewBox="0 0 460 260"
        className="w-full h-full"
        role="img"
        aria-label={`${template.name} topology preview`}
      >
        <defs>
          <pattern
            id={`grid-${template.id}`}
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="0.9" className="fill-foreground/15" />
          </pattern>
        </defs>

        <rect width="460" height="260" fill={`url(#grid-${template.id})`} />

        {layout.lines.map((line) => (
          <line
            key={line.id}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            className="stroke-foreground/25"
            strokeWidth="1.4"
            strokeDasharray="3 3"
          />
        ))}

        {layout.boxes.map((box) => (
          <g key={box.id}>
            <rect
              x={box.x}
              y={box.y}
              width={box.w}
              height={box.h}
              rx="6"
              className="fill-card stroke-foreground/20"
              strokeWidth="1"
            />
            <circle
              cx={box.x + 8}
              cy={box.y + box.h / 2}
              r="2.5"
              className="fill-primary/70"
            />
          </g>
        ))}
      </svg>

      <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-card/90 backdrop-blur-sm border border-border text-caption text-muted-foreground tabular-nums">
        <span>{template.nodes.length} nodes</span>
        <span className="opacity-40">·</span>
        <span>{template.edges.length} connections</span>
      </div>
    </div>
  );
}

/**
 * Editorial split-pane Reference Blueprints gallery (`/templates`).
 */
function TemplatesPage() {
  const navigate = useNavigate();
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const projects = useProjectStore((s) => s.projects);
  const activeProject = projects.find((p) => p.id === activeProjectId);

  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string>(TEMPLATES[0]?.id ?? "");
  const [confirmTemplate, setConfirmTemplate] = useState<Template | null>(null);

  const normalizedQuery = query.trim().toLowerCase();

  const filterList = (list: Array<Template>) => {
    if (!normalizedQuery) return list;
    return list.filter(
      (t) =>
        t.name.toLowerCase().includes(normalizedQuery) ||
        t.description.toLowerCase().includes(normalizedQuery) ||
        t.nodes.some((n) =>
          n.data.label.toLowerCase().includes(normalizedQuery),
        ),
    );
  };

  const archList = filterList(ARCHITECTURE_TEMPLATES);
  const c4List = filterList(C4_TEMPLATES);
  const allVisible = [...archList, ...c4List];

  const activeTemplate =
    allVisible.find((t) => t.id === activeId) ?? allVisible[0] ?? TEMPLATES[0];

  const categoryBreakdown = useMemo(() => {
    if (!activeTemplate) return [];
    const counts = new Map<string, number>();
    for (const node of activeTemplate.nodes) {
      const cat = node.data.category || "microservice";
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [activeTemplate]);

  const handleConfirmLoad = () => {
    if (!confirmTemplate) return;
    clearCanvas();
    loadTemplate(confirmTemplate);
    const target = confirmTemplate;
    setConfirmTemplate(null);
    if (target.category === "c4") {
      if (activeProject) {
        navigate({
          to: "/$slug/c4",
          params: { slug: activeProject.slug } as never,
        });
      } else {
        navigate({ to: "/" });
      }
    } else if (activeProject) {
      navigate({
        to: "/$slug",
        params: { slug: activeProject.slug } as never,
      });
    } else {
      navigate({ to: "/" });
    }
  };

  const renderSection = (
    title: string,
    items: Array<Template>,
    indexOffset: number,
  ) => {
    if (items.length === 0) return null;
    return (
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-caption font-medium uppercase text-muted-foreground">
            {title}
          </h2>
          <span className="text-caption font-mono text-muted-foreground/70 tabular-nums">
            {items.length}
          </span>
        </div>

        <div className="nordic-panel rounded-xl overflow-hidden divide-y divide-border/60">
          {items.map((tpl, idx) => {
            const isSelected = activeTemplate?.id === tpl.id;
            const num = String(indexOffset + idx + 1).padStart(2, "0");
            return (
              <div
                key={tpl.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveId(tpl.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveId(tpl.id);
                  }
                }}
                className={cn(
                  "group relative flex items-start justify-between gap-3 px-4 py-3.5 cursor-pointer transition-colors outline-none",
                  isSelected ? "bg-muted/75" : "hover:bg-muted/40",
                )}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span
                    className={cn(
                      "text-caption font-mono tabular-nums pt-0.5 shrink-0",
                      isSelected
                        ? "text-foreground font-medium"
                        : "text-muted-foreground/60",
                    )}
                  >
                    {num}
                  </span>

                  <div className="min-w-0 space-y-1">
                    <div className="text-body font-medium text-foreground truncate">
                      {tpl.name}
                    </div>
                    <p className="text-small text-muted-foreground line-clamp-2 leading-relaxed">
                      {tpl.description}
                    </p>
                    <div className="flex items-center gap-3 text-caption text-muted-foreground tabular-nums pt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <IconLayersSubtract size={12} stroke={1.6} />
                        {tpl.nodes.length} nodes
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <IconGitBranch size={12} stroke={1.6} />
                        {tpl.edges.length} edges
                      </span>
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <span className="size-5 rounded-full bg-foreground text-background flex items-center justify-center shrink-0 mt-0.5">
                    <IconCheck size={12} stroke={2.2} />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <Container className="pt-20 pb-12 space-y-6">
      <ConfirmModal
        open={Boolean(confirmTemplate)}
        title="Clear canvas and place blueprint?"
        description={`Placing "${confirmTemplate?.name ?? ""}" will clear all existing nodes and connections on your current canvas before loading the blueprint.`}
        confirmText="Clear and place"
        isDestructive
        onClose={() => setConfirmTemplate(null)}
        onConfirm={handleConfirmLoad}
      />

      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border/70">
        <div className="space-y-1">
          <div className="text-caption font-mono uppercase tracking-wider text-muted-foreground">
            Reference Blueprints · {TEMPLATES.length}
          </div>
          <h1 className="text-page font-medium tracking-tight text-foreground">
            Architecture Blueprints
          </h1>
          <p className="text-body text-muted-foreground max-w-xl">
            Inspect a topology schematic before placing it into your active
            workspace.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Input
            type="text"
            size="sm"
            placeholder="Filter blueprints or nodes..."
            leftIcon={<IconSearch size={14} stroke={1.6} />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-9 rounded-full bg-muted/75 border-transparent text-body pr-8"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setQuery("")}
              aria-label="Clear filter"
              className="absolute right-1 top-1/2 -translate-y-1/2"
              icon={<IconX size={16} stroke={1.6} />}
            />
          )}
        </div>
      </div>

      {/* Master-Detail Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Numbered Blueprint Index */}
        <div className="lg:col-span-5 space-y-6">
          {renderSection("System Architectures", archList, 0)}
          {renderSection("C4 Model Blueprints", c4List, archList.length)}

          {allVisible.length === 0 && (
            <div className="p-8 rounded-2xl border border-border/60 bg-card/60 text-center space-y-2">
              <p className="text-body font-medium text-foreground">
                No matching blueprints
              </p>
              <p className="text-small text-muted-foreground">
                Try clearing your filter to browse all {TEMPLATES.length}{" "}
                reference architectures.
              </p>
            </div>
          )}
        </div>

        {/* Right: Sticky Live Schematic & Details */}
        {activeTemplate && (
          <div className="lg:col-span-7 lg:sticky lg:top-20">
            <div className="nordic-panel rounded-xl p-5 space-y-5">
              <BlueprintSchematic template={activeTemplate} />

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-caption font-mono uppercase tracking-wider text-muted-foreground">
                    {activeTemplate.category === "c4"
                      ? "C4 Model"
                      : "System Architecture"}
                  </span>
                  <span className="text-caption font-mono text-muted-foreground tabular-nums">
                    ID · {activeTemplate.id}
                  </span>
                </div>

                <h2 className="text-lg font-medium tracking-tight text-foreground">
                  {activeTemplate.name}
                </h2>
                <p className="text-body text-muted-foreground leading-relaxed">
                  {activeTemplate.description}
                </p>
              </div>

              {/* Category Composition Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {categoryBreakdown.map(([cat, count]) => (
                  <span
                    key={cat}
                    data-category={cat}
                    className="node-category-icon inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-medium capitalize"
                  >
                    <span>{cat}</span>
                    <span className="opacity-70 tabular-nums">{count}</span>
                  </span>
                ))}
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-3">
                <span className="text-caption text-muted-foreground">
                  {activeProject
                    ? `Loads into "${activeProject.name}"`
                    : "Opens in Scratchpad workspace"}
                </span>

                <Button
                  onClick={() => setConfirmTemplate(activeTemplate)}
                  size="default"
                  icon={<IconArrowUpRight size={15} stroke={1.8} />}
                  iconPlacement="right"
                >
                  Use Blueprint
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}
