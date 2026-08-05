import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import Sidebar from '../components/sidebar/Sidebar'
import DiagramCanvas from '../components/canvas/DiagramCanvas'
import CanvasErrorBoundary from '../components/canvas/CanvasErrorBoundary'
import { createProjectFromScratchpad } from '../store/canvas.store'
import { useProjectStore, type ProjectType } from '../store/project.store'
import ProjectSetupPopup from '../components/dashboard/ProjectSetupPopup'
import { Button } from "#/components/ui/button";
import { IconSparkles } from "@tabler/icons-react";

/**
 * Root route for the application.
 */
export const Route = createFileRoute('/')({
  component: HomePage,
})

/**
 * The initial landing page component.
 * Handles automatic redirection to active projects and initial project setup.
 */
function HomePage() {
  const navigate = useNavigate()
  const projects = useProjectStore((s) => s.projects)
  const loading = useProjectStore((s) => s.loading)
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const activeProject = projects.find((p) => p.id === activeProjectId)
  const hasProjects = projects.length > 0
  const [modalOpen, setModalOpen] = useState(!hasProjects)

  useEffect(() => {
    if (!hasProjects) {
      setModalOpen(true)
    }
  }, [hasProjects])

  // Automatic redirect if a project is already active
  useEffect(() => {
    if (activeProject) {
      navigate({ to: '/$slug', params: { slug: activeProject.slug } })
    }
  }, [activeProject, navigate])

  const handleCreateProject = (
    name: string,
    type: ProjectType = "design",
    description?: string,
  ) => {
    const newProject = createProjectFromScratchpad(name, type, description)
    if (!newProject) return
    setModalOpen(false)
    navigate({ to: '/$slug', params: { slug: newProject.slug } })
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse text-muted-foreground">Synthesizing your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      <Sidebar />

      <main className="flex-1 relative overflow-hidden z-10">
        {/* Scratchpad banner — shown until the first project is saved */}
        {!hasProjects && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-2.5 bg-card border border-border rounded-[--radius] shadow-lg px-3 py-2 animate-in slide-in-from-top-2 fade-in duration-300">
              <IconSparkles size={14} className="text-primary shrink-0" />
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                Scratchpad — saved in this browser
              </span>
              <Button
                size="sm"
                variant="default"
                className="h-6 text-[10px]"
                onClick={() => setModalOpen(true)}
              >
                Save as Project
              </Button>
            </div>
          </div>
        )}

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
  )
}