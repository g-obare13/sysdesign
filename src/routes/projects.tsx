/**
 * @fileoverview Projects management dashboard route (`/projects`).
 */

import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  createProject,
  deleteProject,
  updateProject,
  useProjectStore,
} from "@/store/project.store";
import ProjectSetupPopup from "@/components/dashboard/ProjectSetupPopup";
import ConfirmModal from "@/components/ui/ConfirmModal";
import type { Project, ProjectType  } from "@/store/project.store";
import {
  IconArrowRight,
  IconCalendar,
  IconFolderPlus,
  IconInfoCircle,
  IconLayoutGrid,
  IconLayoutList,
  IconPencil,
  IconSitemap,
  IconTrash,
  IconVectorBezier2,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Container from "@/components/ui/container";
import { cn } from "@/lib/utils";

/**
 * Route for the project management dashboard.
 */
export const Route = createFileRoute("/projects")({
  component: ProjectsPage,
});

/**
 * Dashboard component that lists all user projects.
 * Supports searching, grid/list view toggling, and project deletion.
 *
 * @returns Projects management dashboard view element
 */
function ProjectsPage() {
  const navigate = useNavigate();
  const projects = useProjectStore((s) => s.projects);
  const loading = useProjectStore((s) => s.loading);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [modalOpen, setModalOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [renameTarget, setRenameTarget] = useState<Project | null>(null);
  const [renameValue, setRenameValue] = useState("");

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

  const handleDeleteRequest = (p: Project) => {
    setDeleteTarget(p);
  };

  const handleRenameRequest = (p: Project) => {
    setRenameTarget(p);
    setRenameValue(p.name);
  };

  const confirmRename = () => {
    if (renameTarget && renameValue.trim()) {
      updateProject(renameTarget.id, { name: renameValue.trim() });
      setRenameTarget(null);
      setRenameValue("");
    }
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteProject(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground font-medium">
              Loading projects…
            </p>
          </div>
        </div>
      </Container>
    );
  }

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Container className="max-w-none w-full flex-1 px-0 overflow-y-auto">
      <div className="min-h-screen bg-background p-6 lg:p-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/80 pb-4">
            <div className="flex flex-col gap-0.5">
              <h1 className="text-lg font-semibold text-foreground">
                Projects
              </h1>
              <p className="text-xs text-muted-foreground">
                Manage and organize your architecture designs
              </p>
            </div>

            <Button
              size="sm"
              icon={IconFolderPlus}
              iconPlacement="left"
              onClick={() => setModalOpen(true)}
            >
              New Project
            </Button>
          </div>

          <div className="bg-muted/30 border border-border/60 rounded-md px-3 py-2 flex gap-2 items-center">
            <IconInfoCircle
              size={14}
              className="text-primary shrink-0"
            />
            <p className="text-xs text-muted-foreground">
              Storage quota: Each user is allocated up to <span className="font-semibold text-foreground">5 active projects</span>.
            </p>
          </div>

          {/* Toolbar & Search */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Input
                type="text"
                size="sm"
                placeholder="Search projects…"
                leftIcon={<IconFolderPlus size={13} className="text-muted-foreground" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex items-center bg-muted/40 border border-border rounded p-0.5">
              <button
                type="button"
                onClick={() => setView("grid")}
                className={cn(
                  "p-1 rounded text-xs transition-colors cursor-pointer",
                  view === "grid"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title="Grid view"
              >
                <IconLayoutGrid size={14} />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={cn(
                  "p-1 rounded text-xs transition-colors cursor-pointer",
                  view === "list"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title="List view"
              >
                <IconLayoutList size={14} />
              </button>
            </div>
          </div>

          {/* Grid View */}
          {view === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="group relative flex flex-col justify-between gap-3 p-3.5 bg-card border border-border rounded-md hover:border-border-strong transition-colors shadow-none"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded-xs text-[9.5px] font-mono font-medium uppercase tracking-wider flex items-center gap-1 border",
                          p.type === "c4"
                            ? "bg-muted text-foreground border-border"
                            : "bg-primary/10 text-primary border-primary/20",
                        )}
                      >
                        {p.type === "c4" ? (
                          <IconSitemap size={11} />
                        ) : (
                          <IconVectorBezier2 size={11} />
                        )}
                        {p.type === "c4" ? "C4 Model" : "Architecture"}
                      </span>

                      <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleRenameRequest(p)}
                          title="Rename project"
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        >
                          <IconPencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(p)}
                          title="Delete project"
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        >
                          <IconTrash size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <h6 className="text-xs font-semibold text-foreground truncate">
                        {p.name}
                      </h6>
                      <p className="text-xs text-muted-foreground line-clamp-2 min-h-8">
                        {p.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-border/60">
                    <div className="flex items-center gap-1 text-[10.5px] font-mono text-muted-foreground">
                      <IconCalendar size={12} />
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </div>
                    <Link
                      to="/$slug"
                      params={{ slug: p.slug }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline transition-colors"
                    >
                      Open Editor
                      <IconArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="flex flex-col border border-border rounded-md bg-card overflow-hidden">
              {filtered.map((p, idx) => (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-center justify-between p-3 hover:bg-muted/40 transition-colors",
                    idx !== filtered.length - 1 && "border-b border-border/60",
                  )}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-mono font-medium uppercase",
                        p.type === "c4"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-primary/10 text-primary border border-primary/20",
                      )}
                    >
                      {p.type === "c4" ? "C4" : "ARCH"}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium text-foreground truncate">
                        {p.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate max-w-md">
                        {p.description || "No description provided."}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                      <IconCalendar size={12} />
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Link
                        to="/$slug"
                        params={{ slug: p.slug }}
                        className="inline-flex items-center gap-1 h-7 px-2.5 rounded text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        Open
                        <IconArrowRight size={12} />
                      </Link>
                      <button
                        onClick={() => handleRenameRequest(p)}
                        title="Rename project"
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        <IconPencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteRequest(p)}
                        title="Delete project"
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      >
                        <IconTrash size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="flex flex-col gap-2 items-center justify-center py-16 bg-card border border-dashed border-border rounded-lg text-center">
              <h6 className="text-sm font-semibold text-foreground">No projects found</h6>
              <p className="text-xs text-muted-foreground max-w-sm mb-2">
                Create a project to start designing your system architecture.
              </p>
              <Button
                size="sm"
                icon={IconFolderPlus}
                iconPlacement="left"
                onClick={() => setModalOpen(true)}
              >
                Create Project
              </Button>
            </div>
          )}
        </div>

        {/* Rename Modal */}
        {renameTarget && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-background/60 backdrop-blur-xs animate-in fade-in duration-150 p-4">
            <div className="bg-card border border-border rounded-lg shadow-xl p-5 w-full max-w-sm animate-in zoom-in-98 duration-150 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <IconPencil size={13} />
                  </div>
                  <h6 className="text-xs font-semibold text-foreground">Rename Project</h6>
                </div>
                <button
                  onClick={() => setRenameTarget(null)}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <IconX size={14} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  confirmRename();
                }}
                className="flex flex-col gap-3"
              >
                <div className="flex flex-col gap-1">
                  <Label htmlFor="rename-input" className="text-[11px]">Project Name</Label>
                  <Input
                    id="rename-input"
                    size="sm"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    placeholder="Enter project name"
                    autoFocus
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRenameTarget(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!renameValue.trim()}
                  >
                    Save
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ProjectSetupPopup
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreate={handleCreateProject}
        />

        <ConfirmModal
          open={!!deleteTarget}
          isDestructive
          title="Delete Project"
          description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
          confirmText="Delete Project"
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      </div>
    </Container>
  );
}
