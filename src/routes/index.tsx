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
import WorkspaceSkeleton from '@/components/layout/WorkspaceSkeleton'
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
  const targetProject = activeProject ?? projects[0]
  const hasProjects = projects.length > 0
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (loading) return
    setModalOpen(!hasProjects)
  }, [loading, hasProjects])

  // Automatic redirect if the user already has a project
  useEffect(() => {
    if (!loading && targetProject) {
      const isC4 = targetProject.type === "c4";
      navigate({
        to: isC4 ? "/$slug/c4" : "/$slug",
        params: { slug: targetProject.slug } as any,
      });
    }
  }, [loading, targetProject, navigate]);

  const handleCreateProject = (
    name: string,
    type: ProjectType = "design",
    description?: string,
  ) => {
    const newProject = createProjectFromScratchpad(name, type, description)
    if (!newProject) return
    setModalOpen(false)
    navigate({
      to: type === "c4" ? "/$slug/c4" : "/$slug",
      params: { slug: newProject.slug } as any,
    })
  }

  if (loading || targetProject) {
    return <WorkspaceSkeleton />;
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      <Sidebar />

      <main className="flex-1 relative overflow-hidden z-10">
        {/* Scratchpad banner: shown until the first project is saved */}
        {!hasProjects && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-2.5 nordic-panel rounded-xl px-3.5 py-1.5 animate-in slide-in-from-top-1 fade-in duration-200">
              <IconSparkles size={13} className="text-primary shrink-0" />
              <span className="text-caption font-mono text-muted-foreground whitespace-nowrap">
                Scratchpad mode
              </span>
              <Button
                size="sm"
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