/**
 * @fileoverview Architecture & C4 Template gallery route (`/templates`).
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TEMPLATES  } from "@/data/templates";
import type {Template} from "@/data/templates";
import { loadTemplate } from "@/store/canvas.store";
import { useProjectStore } from "@/store/project.store";
import { useState } from "react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  IconBrain,
  IconCompass,
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
    <main className="min-h-screen pt-8 pb-14 px-6 max-w-6xl mx-auto w-full animate-in fade-in duration-200">
      <ConfirmModal
        open={!!selectedTemplate}
        title={`Load ${selectedTemplate?.name}?`}
        description={`This will clear your current canvas and load "${selectedTemplate?.name}".`}
        confirmText="Load Template"
        onClose={() => setSelectedTemplate(null)}
        onConfirm={handleConfirmLoad}
      />

      <div className="text-center mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground mb-1.5">
          Architecture & C4 Templates
        </h1>
        <p className="max-w-xl mx-auto text-xs text-muted-foreground leading-relaxed">
          Production-grade system architectures and C4 Model templates with tiered groupings, labeled flows, and industry-standard abstractions.
        </p>

        {/* Filter Tabs */}
        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-md bg-muted/60 border border-border/60 mt-4">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "px-2.5 py-1 rounded-xs text-xs font-medium transition-colors cursor-pointer select-none border",
              selectedCategory === "all"
                ? "bg-primary/12 text-primary border-primary/30 font-semibold shadow-none"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent",
            )}
          >
            All Templates ({TEMPLATES.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("architecture")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-xs font-medium transition-colors cursor-pointer select-none border",
              selectedCategory === "architecture"
                ? "bg-primary/12 text-primary border-primary/30 font-semibold shadow-none"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent",
            )}
          >
            <IconCompass size={12} />
            Architecture (3)
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("c4")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-xs font-medium transition-colors cursor-pointer select-none border",
              selectedCategory === "c4"
                ? "bg-primary/12 text-primary border-primary/30 font-semibold shadow-none"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent",
            )}
          >
            <IconBrain size={12} />
            C4 Model (3)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="group relative flex flex-col justify-between bg-card border border-border rounded-md p-4 transition-colors hover:border-border-strong shadow-none"
          >
            <div>
              {/* Category badge */}
              <div className="flex items-center justify-between mb-2.5">
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-xs text-[9.5px] font-mono font-medium tracking-tight uppercase border",
                    tpl.category === "c4"
                      ? "bg-muted text-foreground border-border"
                      : "bg-primary/10 text-primary border-primary/20",
                  )}
                >
                  {tpl.category === "c4" ? "C4 Model" : "Architecture"}
                </span>
                <span className="text-[10.5px] font-mono text-muted-foreground">
                  {tpl.nodes.length} nodes · {tpl.edges.length} edges
                </span>
              </div>

              <h6 className="text-xs font-semibold text-foreground mb-1">
                {tpl.name}
              </h6>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                {tpl.description}
              </p>
            </div>

            <div className="pt-2.5 border-t border-border/60 mt-auto">
              <Button
                onClick={() => setSelectedTemplate(tpl)}
                size="sm"
                variant="default"
                className="w-full justify-center text-xs"
              >
                Load Template
              </Button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
