/**
 * @fileoverview Architecture & C4 Template gallery route (`/templates`).
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TEMPLATES, type Template } from "@/data/templates";
import { loadTemplate } from "@/store/canvas.store";
import { useProjectStore } from "@/store/project.store";
import { useState } from "react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  IconCompass,
  IconBrain,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/templates")({
  component: TemplatesPage,
});

type FilterCategory = "all" | "architecture" | "c4";

/**
 * Templates gallery browsing page allowing users to preview and load architectural patterns.
 *
 * @returns Templates gallery view element
 */
function TemplatesPage() {
  const navigate = useNavigate();
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const projects = useProjectStore((s) => s.projects);
  const activeProject = projects.find((p) => p.id === activeProjectId);

  const [selectedCategory, setSelectedCategory] =
    useState<FilterCategory>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null,
  );

  const filteredTemplates =
    selectedCategory === "all"
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === selectedCategory);

  const handleConfirmLoad = () => {
    if (selectedTemplate) {
      loadTemplate(selectedTemplate);
      if (selectedTemplate.category === "c4") {
        if (activeProject) {
          navigate({
            to: "/$slug/c4",
            params: { slug: activeProject.slug } as any,
          });
        } else {
          navigate({ to: "/" });
        }
      } else {
        if (activeProject) {
          navigate({
            to: "/$slug",
            params: { slug: activeProject.slug } as any,
          });
        } else {
          navigate({ to: "/" });
        }
      }
    }
  };

  return (
    <main className="min-h-screen pt-24 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <ConfirmModal
        open={!!selectedTemplate}
        title={`Load ${selectedTemplate?.name}?`}
        description={`This will load the "${selectedTemplate?.name}" design onto your canvas.`}
        confirmText="Load Template"
        onClose={() => setSelectedTemplate(null)}
        onConfirm={handleConfirmLoad}
      />

      <div className="text-center mb-10">
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-linear-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
          System & C4 Design Templates
        </h1>
        <p className="max-w-2xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed">
          Production-grade system architectures and C4 Model templates with
          tiered groupings, labeled flows, and industry-standard abstractions.
        </p>

        {/* Filter Tabs */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer select-none",
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            All Templates ({TEMPLATES.length})
          </button>
          <button
            onClick={() => setSelectedCategory("architecture")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer select-none",
              selectedCategory === "architecture"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <IconCompass size={14} />
            Architecture (3)
          </button>
          <button
            onClick={() => setSelectedCategory("c4")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer select-none",
              selectedCategory === "c4"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <IconBrain size={14} />
            C4 Model (3)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="group relative flex flex-col bg-card border border-border/60 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/40"
          >
            {/* Category badge */}
            <div className="flex items-center justify-between mb-3">
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-tight uppercase",
                  tpl.category === "c4"
                    ? "bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20"
                    : "bg-primary/10 text-primary border border-primary/20",
                )}
              >
                {tpl.category === "c4" ? "C4 Model" : "Architecture"}
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                {tpl.nodes.length} nodes · {tpl.edges.length} edges
              </span>
            </div>

            <h2 className="text-xl font-bold mb-2.5 text-foreground">
              {tpl.name}
            </h2>
            <p className="text-muted-foreground text-xs leading-relaxed mb-6 grow">
              {tpl.description}
            </p>

            <div className="flex flex-col gap-3 mt-auto">
              <Button
                onClick={() => setSelectedTemplate(tpl)}
                size="lg"
                variant="shiny"
                className="text-xs w-full justify-center rounded-full"
              >
                <span>Load Template</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
