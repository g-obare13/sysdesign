/**
 * @fileoverview Default landing route for the application (`/`).
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/sidebar/Sidebar'
import DiagramCanvas from '@/components/canvas/DiagramCanvas'
import CanvasErrorBoundary from '@/components/canvas/CanvasErrorBoundary'
import { createProjectFromScratchpad } from '@/store/canvas.store'
import {  useProjectStore } from '@/store/project.store'
import type {ProjectType} from '@/store/project.store';
import ProjectSetupPopup from '@/components/dashboard/ProjectSetupPopup'
import { Button } from "@/components/ui/button";
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
 *
 * @returns Home page workspace element
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
      const isC4 = activeProject.type === "c4";
      navigate({
        to: isC4 ? "/$slug/c4" : "/$slug",
        params: { slug: activeProject.slug } as any,
      });
    }
  }, [activeProject, navigate]);

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
        <div className="flex flex-col items-center gap-3">
          <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-muted-foreground">Initializing workspace…</p>
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
            <div className="flex items-center gap-2 bg-card/95 backdrop-blur-xs border border-border rounded-md shadow-md px-3 py-1.5 animate-in slide-in-from-top-1 fade-in duration-200">
              <IconSparkles size={13} className="text-primary shrink-0" />
              <span className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">
                Scratchpad mode
              </span>
              <Button
                size="xs"
                variant="default"
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