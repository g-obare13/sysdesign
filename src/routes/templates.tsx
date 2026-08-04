import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TEMPLATES } from "../data/templates";
import { loadTemplate } from "../store/canvas.store";
import { useState } from "react";
import ConfirmModal from "../components/ui/ConfirmModal";
import {
  IconArrowRight,
  IconSparkles,
} from "@tabler/icons-react";
import { Button } from "#/components/ui/button";

export const Route = createFileRoute("/templates")({
  component: TemplatesPage,
});

function TemplatesPage() {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<
    (typeof TEMPLATES)[0] | null
  >(null);

  const handleConfirmLoad = () => {
    if (selectedTemplate) {
      loadTemplate(selectedTemplate);
      navigate({ to: "/" });
    }
  };

  return (
    <main className="min-h-screen pt-24 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <ConfirmModal
        open={!!selectedTemplate}
        title="Load Architecture Template?"
        description={`This will clear your current canvas and load the "${selectedTemplate?.name}" design. This action cannot be undone.`}
        confirmText="Load Template"
        onClose={() => setSelectedTemplate(null)}
        onConfirm={handleConfirmLoad}
      />

      <div className="text-center mb-16">
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-linear-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
          Architecture Templates
        </h1>
        <p className="max-w-2xl mx-auto text-lg leading-relaxed">
          High-fidelity system designs from the world's most successful tech
          companies. Load them into the canvas to study, modify, or use as a
          foundation for your own systems.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {TEMPLATES.map((tpl) => (
          <div
            key={tpl.id}
            className="group relative flex flex-col bg-card border border-border/60 rounded-xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/30"
          >
            <h2 className="text-2xl font-bold mb-3">{tpl.name}</h2>
            <p className="text-muted-foreground text-[14px] leading-relaxed mb-8 grow">
              {tpl.description}
            </p>

            <div className="flex flex-col gap-3 mt-auto">
              <Button
                onClick={() => setSelectedTemplate(tpl)}
                size={"lg"}
                variant={"default"}
                className={"text-xs"}
              >
                Load Template
                <IconArrowRight size={16} />
              </Button>

              <div className="flex items-center justify-center gap-4 text-[12px] text-muted-foreground font-medium border-t border-border/40 pt-4">
                <span className="flex items-center gap-1.5 opacity-70">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />{" "}
                  {tpl.nodes.length} Nodes
                </span>
                <span className="flex items-center gap-1.5 opacity-70">
                  <div className="w-1.5 h-1.5 rounded-full bg-border" />{" "}
                  {tpl.edges.length} Connections
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Placeholder for coming soon */}
        <div className="relative flex flex-col bg-muted/10 border border-dashed border-border rounded-xl p-6 overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-primary/5 opacity-50" />
          <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-6 opacity-40">
            <IconSparkles size={28} className="text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-3 opacity-40">More Coming</h2>
          <p className="text-muted-foreground text-[14px] leading-relaxed mb-8 opacity-40">
            TikTok, Uber, and Instagram architectures are currently being
            designed.
          </p>
          <div className="mt-auto pt-4 border-t border-border/40 text-[12px] text-muted-foreground/40 italic font-medium">
            AI-assisted generation coming soon
          </div>
        </div>
      </div>
    </main>
  );
}
