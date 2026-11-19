/**
 * @fileoverview Projects management dashboard route (`/projects`).
 */

import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  MAX_PROJECTS,
  createProject,
  deleteProject,
  updateProject,
  useProjectStore,
} from "@/store/project.store";
import ProjectSetupPopup from "@/components/dashboard/ProjectSetupPopup";
import ConfirmModal from "@/components/ui/ConfirmModal";
import type { Project, ProjectType } from "@/store/project.store";
import {
  IconArrowRight,
  IconCalendar,
  IconFolderPlus,
  IconLayoutGrid,
  IconLayoutList,
  IconPencil,
  IconSearch,
  IconSitemap,
  IconTrash,
  IconVectorBezier2,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Route for the project management dashboard.
 */
export const Route = createFileRoute("/projects")({
  component: ProjectsPage,
});

/**
 * Nordic studio dashboard component that lists all user projects.
 * Supports searching, grid/list view toggling, renaming, and deletion.
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
    navigate({
      to: type === "c4" ? "/$slug/c4" : "/$slug",
      params: { slug: newProject.slug } as any,
    });
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
      <main className="flex-1 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-6 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
          <p className="text-[12.5px] text-muted-foreground font-medium">
            Loading projects…
          </p>
        </div>
      </main>
    );
  }

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <main className="flex-1 w-full bg-background">
      <div className="max-w-5xl mx-auto w-full pt-20 pb-10 px-6 flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-[22px] font-semibold tracking-tight text-foreground leading-none">
                Projects
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-medium text-muted-foreground tabular-nums">
                {projects.length} / {MAX_PROJECTS}
              </span>
            </div>
            <p className="text-[13px] text-muted-foreground">
              Manage and organize your system architectures and C4 models.
            </p>
          </div>

          <Button
            size="sm"
            icon={IconFolderPlus}
            iconPlacement="left"
            onClick={() => setModalOpen(true)}
            disabled={projects.length >= MAX_PROJECTS}
          >
            New Project
          </Button>
        </div>

        {/* Search & View Switcher */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <Input
              type="text"
              size="sm"
              placeholder="Search projects…"
              leftIcon={
                <IconSearch
                  size={14}
                  stroke={1.6}
                  className="text-muted-foreground"
                />
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 rounded-xl bg-card border border-black/[0.06] dark:border-white/[0.07] shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            />
          </div>

          <div className="flex items-center p-1 rounded-xl bg-muted/85">
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => setView("grid")}
                    className={cn(
                      "size-7 rounded-lg flex items-center justify-center transition-all cursor-pointer",
                      view === "grid"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    aria-label="Grid view"
                  >
                    <IconLayoutGrid size={15} stroke={1.6} />
                  </button>
                }
              />
              <TooltipContent side="top">Grid view</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className={cn(
                      "size-7 rounded-lg flex items-center justify-center transition-all cursor-pointer",
                      view === "list"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    aria-label="List view"
                  >
                    <IconLayoutList size={15} stroke={1.6} />
                  </button>
                }
              />
              <TooltipContent side="top">List view</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Grid View */}
        {view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => {
              const targetRoute = p.type === "c4" ? "/$slug/c4" : "/$slug";
              return (
                <div
                  key={p.id}
                  className="group relative flex flex-col justify-between gap-4 p-5 nordic-panel rounded-[20px] transition-all hover:-translate-y-0.5"
                >
                  <div className="flex flex-col gap-3.5">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-2">
                        <div className="size-8 rounded-xl bg-muted flex items-center justify-center text-foreground/80">
                          {p.type === "c4" ? (
                            <IconSitemap size={15} stroke={1.6} />
                          ) : (
                            <IconVectorBezier2 size={15} stroke={1.6} />
                          )}
                        </div>
                        <span className="text-[11.5px] font-medium text-muted-foreground">
                          {p.type === "c4" ? "C4 Model" : "Architecture"}
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <button
                                type="button"
                                onClick={() => handleRenameRequest(p)}
                                aria-label="Rename project"
                                className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                              >
                                <IconPencil size={14} stroke={1.6} />
                              </button>
                            }
                          />
                          <TooltipContent side="top">
                            Rename project
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <button
                                type="button"
                                onClick={() => handleDeleteRequest(p)}
                                aria-label="Delete project"
                                className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                              >
                                <IconTrash size={14} stroke={1.6} />
                              </button>
                            }
                          />
                          <TooltipContent side="top">
                            Delete project
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <h2 className="text-[15px] font-semibold text-foreground tracking-tight truncate">
                        {p.name}
                      </h2>
                      <p className="text-[12.5px] text-muted-foreground line-clamp-2 min-h-9 leading-relaxed">
                        {p.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3.5 border-t border-border/60">
                    <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground tabular-nums">
                      <IconCalendar size={13} stroke={1.6} />
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </div>

                    <Link
                      to={targetRoute}
                      params={{ slug: p.slug } as any}
                      className="nordic-btn inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-[12px] font-medium"
                    >
                      <span>Open</span>
                      <IconArrowRight size={13} stroke={1.7} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="flex flex-col nordic-panel rounded-[20px] overflow-hidden">
            {filtered.map((p, idx) => {
              const targetRoute = p.type === "c4" ? "/$slug/c4" : "/$slug";
              return (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors",
                    idx !== filtered.length - 1 && "border-b border-border/60",
                  )}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="size-8 rounded-xl bg-muted flex items-center justify-center text-foreground/80 shrink-0">
                      {p.type === "c4" ? (
                        <IconSitemap size={15} stroke={1.6} />
                      ) : (
                        <IconVectorBezier2 size={15} stroke={1.6} />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[13.5px] font-semibold text-foreground truncate">
                        {p.name}
                      </span>
                      <span className="text-[12px] text-muted-foreground truncate max-w-md">
                        {p.description || "No description provided."}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="hidden sm:inline-block text-[11.5px] text-muted-foreground">
                      {p.type === "c4" ? "C4 Model" : "Architecture"}
                    </span>
                    <div className="text-[11.5px] text-muted-foreground tabular-nums flex items-center gap-1.5">
                      <IconCalendar size={13} stroke={1.6} />
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={targetRoute}
                        params={{ slug: p.slug } as any}
                        className="nordic-btn inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-[12px] font-medium"
                      >
                        <span>Open</span>
                        <IconArrowRight size={13} stroke={1.7} />
                      </Link>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <button
                              type="button"
                              onClick={() => handleRenameRequest(p)}
                              aria-label="Rename project"
                              className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            >
                              <IconPencil size={14} stroke={1.6} />
                            </button>
                          }
                        />
                        <TooltipContent side="top">
                          Rename project
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <button
                              type="button"
                              onClick={() => handleDeleteRequest(p)}
                              aria-label="Delete project"
                              className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                            >
                              <IconTrash size={14} stroke={1.6} />
                            </button>
                          }
                        />
                        <TooltipContent side="top">
                          Delete project
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col gap-2.5 items-center justify-center py-16 nordic-panel rounded-[20px] text-center">
            <h6 className="text-[15px] font-semibold text-foreground">
              No projects found
            </h6>
            <p className="text-[12.5px] text-muted-foreground max-w-sm mb-1">
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
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-background/70 backdrop-blur-sm animate-in fade-in duration-150 p-4">
          <div className="nordic-panel rounded-[20px] p-5 w-full max-w-sm animate-in zoom-in-98 duration-150 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-muted flex items-center justify-center text-foreground">
                  <IconPencil size={14} stroke={1.6} />
                </div>
                <h6 className="text-[13.5px] font-semibold text-foreground">
                  Rename Project
                </h6>
              </div>
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                className="size-7 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <IconX size={15} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                confirmRename();
              }}
              className="flex flex-col gap-3.5"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rename-input" className="text-[12px]">
                  Project Name
                </Label>
                <Input
                  id="rename-input"
                  size="sm"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  placeholder="Enter project name"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-border/50">
                <Button
                  type="button"
                  variant="ghost"
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
    </main>
  );
}
