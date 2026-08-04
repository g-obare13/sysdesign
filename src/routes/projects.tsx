import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  useProjectStore,
  deleteProject,
  createProject,
  updateProject,
} from "../store/project.store";
import ProjectSetupPopup from "../components/dashboard/ProjectSetupPopup";
import ConfirmModal from "../components/ui/ConfirmModal";
import type { Project } from "../store/project.store";
import {
  IconTrash,
  IconCalendar,
  IconArrowRight,
  IconLayoutGrid,
  IconLayoutList,
  IconInfoCircle,
  IconFolderPlus,
  IconSitemap,
  IconVectorBezier2,
  IconPencil,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import Container from "#/components/ui/container";
import { cn } from "../lib/utils";
import type { ProjectType } from "../store/project.store";

/**
 * Route for the project management dashboard.
 */
export const Route = createFileRoute("/projects")({
  component: ProjectsPage,
});

/**
 * Dashboard component that lists all user projects.
 * Supports searching, grid/list view toggling, and project deletion.
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
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground animate-pulse font-medium">
              Loading your projects...
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
      <div className="min-h-screen bg-background p-8 w-full px-4 lg:px-12">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex items-end justify-between border-b pb-6">
            <div className="flex flex-col gap-1.5">
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                Projects
              </h1>
              <p className="text-muted-foreground">
                Manage and organize your system architect diagrams
              </p>
            </div>

            <Button
              icon={IconFolderPlus}
              iconSide="right"
              onClick={() => setModalOpen(true)}
            >
              New Project
            </Button>
          </div>

          <div className="bg-muted/30 border border-border/50 rounded-lg p-3 flex gap-2.5 items-start">
            <IconInfoCircle
              size={14}
              className="text-primary shrink-0 mt-0.5"
            />
            <p className="text-[10.5px] leading-normal text-muted-foreground">
              To keep the service fast and free for everyone, we limit each user
              to <span className="font-bold text-foreground">5 projects</span>.
            </p>
          </div>

          {/* Toolbar & Search */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              {/* <IconSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            /> */}
              <Input
                type="text"
                size={"lg"}
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center bg-card border border-border rounded-xs p-1">
              <Button
                onClick={() => setView("grid")}
                variant={"ghost"}
                size={"icon"}
                className={`transition-all ${view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <IconLayoutGrid size={18} stroke={1.5} />
              </Button>
              <Button
                onClick={() => setView("list")}
                variant={"ghost"}
                size={"icon"}
                className={`transition-all ${view === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <IconLayoutList size={18} stroke={1.5} />
              </Button>
            </div>
          </div>

          {/* Grid View */}
          {view === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="group relative flex flex-col gap-4 p-5 bg-card border border-border rounded-xs hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1 items-start">
                      <div
                        className={cn(
                          "mt-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1",
                          // p.type === "c4"
                          //   ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          //   : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                        )}
                      >
                        {p.type === "c4" ? (
                          <IconSitemap size={10} />
                        ) : (
                          <IconVectorBezier2 size={10} />
                        )}
                        {p.type === "c4" ? "C4 Model" : "Architecture"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        onClick={() => handleRenameRequest(p)}
                        title="Rename project"
                        variant={"outline"}
                        size={"icon"}
                      >
                        <IconPencil size={14} />
                      </Button>
                      <Button
                        onClick={() => handleDeleteRequest(p)}
                        title="Delete project"
                        variant={"destructive"}
                        size={"icon"}
                      >
                        <IconTrash size={16} />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <h3>{p.name}</h3>
                    <p className="line-clamp-2 min-h-10">
                      {p.description || "No description provided."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <IconCalendar size={13} />
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </div>
                    <Link
                      to="/$slug"
                      params={{ slug: p.slug }}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:gap-2 transition-all"
                    >
                      Open Editor
                      <IconArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="flex flex-col border border-border rounded-xs bg-card overflow-hidden">
              {filtered.map((p, idx) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-4 hover:bg-muted/50 transition-all ${idx !== filtered.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-tight",
                          p.type === "c4"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                        )}
                      >
                        {p.type === "c4" ? "C4" : "ARCH"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-sm font-semibold text-foreground">
                        {p.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate max-w-md">
                        {p.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <IconCalendar size={13} />
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to="/$slug"
                        params={{ slug: p.slug }}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xs text-xs font-bold text-primary hover:bg-primary/10 transition-all"
                      >
                        Open
                        <IconArrowRight size={14} />
                      </Link>
                      <Button
                        onClick={() => handleRenameRequest(p)}
                        title="Rename project"
                        variant={"outline"}
                        size={"icon"}
                      >
                        <IconPencil size={14} />
                      </Button>
                      <Button
                        onClick={() => handleDeleteRequest(p)}
                        title="Delete project"
                        variant={"destructive"}
                        size={"icon"}
                      >
                        <IconTrash size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="flex flex-col gap-4 items-center justify-center py-20 bg-card border border-dashed rounded-2xl animate-in fade-in zoom-in-95 duration-500">
              <h3>No projects found</h3>
              <p>
                Invite your team or create your first architecture project to
                get started.
              </p>
              <Button
                icon={IconFolderPlus}
                iconSide="right"
                onClick={() => setModalOpen(true)}
              >
                New Project
              </Button>
            </div>
          )}
        </div>

        {/* Rename Modal */}
        {renameTarget && (
          <div className="fixed inset-0 z-1000 flex items-center justify-center bg-background/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-card border border-border rounded-[--radius] shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <IconPencil size={16} />
                  </div>
                  <h2 className="text-sm font-bold">Rename Project</h2>
                </div>
                <Button
                  onClick={() => setRenameTarget(null)}
                  icon={IconX}
                  variant="outline"
                  size="icon-sm"
                />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  confirmRename();
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="rename-input">Project name</Label>
                  <Input
                    id="rename-input"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    placeholder="Enter a new name"
                    autoFocus
                  />
                </div>
                <div className="flex items-center justify-end gap-2.5">
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
                    icon={IconCheck}
                    iconSide="right"
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
          description={`Are you sure you want to delete "${deleteTarget?.name}"? This will permanently remove all associated diagram data.`}
          confirmText="Delete Project"
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      </div>
    </Container>
  );
}
