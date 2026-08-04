import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import Sidebar from "../components/sidebar/Sidebar";
import DiagramCanvas from "../components/canvas/DiagramCanvas";
import CanvasErrorBoundary from "../components/canvas/CanvasErrorBoundary";
import {
  createProject,
  useProjectStore,
  setActiveProject,
} from "../store/project.store";
import ProjectSetupPopup from "../components/dashboard/ProjectSetupPopup";
import Container from "#/components/ui/container";
import type { ProjectType } from "../store/project.store";
import { setDiagramMode } from "../store/canvas.store";
import { Button } from "#/components/ui/button";
import { IconFolderPlus } from "@tabler/icons-react";

/**
 * Dynamic route for individual project canvases, identified by their slug.
 */
export const Route = createFileRoute("/$slug")({
  component: SlugPage,
});

/**
 * The main editor page for a specific project.
 * Synchronizes the active project state with the URL slug and renders the canvas.
 */
function SlugPage() {
  const { slug } = Route.useParams();
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const navigate = useNavigate();

  const project = projects.find((p) => p.slug === slug);
  const [modalOpen, setModalOpen] = useState(false);

  // Sync active project state based on URL slug
  useEffect(() => {
    if (project) {
      if (project.id !== activeProjectId) {
        setActiveProject(project.id);
      }
      // If it's a C4 project but we are on the base route, redirect to C4 route
      if (project.type === "c4") {
        navigate({ to: "/$slug/c4", params: { slug: project.slug } as any });
      } else {
        setDiagramMode("architecture");
      }
    }
  }, [project, activeProjectId, projects.length]);

  const handleCreateProject = (
    name: string,
    type: ProjectType,
    description?: string,
  ) => {
    const newProject = createProject(name, type, description);
    if (!newProject) return;
    setModalOpen(false);
    navigate({ to: "/$slug", params: { slug: newProject.slug } });
  };

  // If no project found for this slug, we can show the "Create" popup or redirect
  if (!project) {
    return (
      <Container>
        <div className="flex flex-col h-screen items-center justify-center bg-background p-4">
          <h1>Project not found</h1>
          <p>The project you"re looking for doesn"t exist or has been moved.</p>

          <Button
            icon={IconFolderPlus}
            iconSide="right"
            onClick={() => navigate({ to: "/projects" })}
          >
            Browse Projects
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      <Sidebar />

      <main className="flex-1 relative overflow-hidden z-10">
        <CanvasErrorBoundary>
          <DiagramCanvas />
        </CanvasErrorBoundary>
      </main>

      <ProjectSetupPopup
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
}
