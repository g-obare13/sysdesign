/**
 * @fileoverview C4 Architecture editor page mapped to a project slug (`/$slug/c4`).
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import DiagramCanvas from "@/components/canvas/DiagramCanvas";
import CanvasErrorBoundary from "@/components/canvas/CanvasErrorBoundary";
import { useProjectStore, setActiveProject } from "@/store/project.store";
import { setDiagramMode } from "@/store/canvas.store";
import Container from "@/components/ui/container";
import { IconFolderPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/$slug/c4")({
  component: C4Page,
});

/**
 * C4 diagram editor view for a given project slug.
 *
 * @returns C4 diagram editing workspace element
 */
function C4Page() {
  const { slug } = Route.useParams();
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const navigate = useNavigate();

  const project = projects.find((p) => p.slug === slug);

  useEffect(() => {
    if (project) {
      if (project.id !== activeProjectId) {
        setActiveProject(project.id);
      }
      setDiagramMode("c4");
    }
  }, [project, activeProjectId]);

  if (!project) {
    return (
      <Container>
        <div className="flex flex-col gap-3 h-screen items-center justify-center bg-background p-4">
          <h1>Project not found</h1>
          <p>The project you're looking for doesn't exist or has been moved.</p>

          <Button
            icon={IconFolderPlus}
            iconPlacement="right"
            variant={"shiny"}
            size="pill"
            onClick={() => navigate({ to: "/projects" })}
          >
            Browse Projects
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <div className="relative flex-1 flex h-full overflow-hidden w-full">
      <Sidebar />
      <main className="flex-1 relative overflow-hidden z-10 w-full h-full">
        <CanvasErrorBoundary>
          <DiagramCanvas />
        </CanvasErrorBoundary>
      </main>
    </div>
  );
}
