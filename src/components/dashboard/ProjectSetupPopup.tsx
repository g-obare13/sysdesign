/**
 * @fileoverview Modal dialog allowing users to configure and initialize a new architecture or C4 diagram project.
 */

import { useState } from "react";
import { createPortal } from "react-dom";
import { IconX } from "@tabler/icons-react";
import {
  MAX_PROJECTS,
  
  useProjectStore
} from "@/store/project.store";
import type {ProjectType} from "@/store/project.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProjectSetupPopupProps {
  /** Whether the modal is currently visible */
  open: boolean;
  /** Callback function to close the modal */
  onClose: () => void;
  /** Callback function called when a new project is submitted */
  onCreate: (name: string, type: ProjectType, description?: string) => void;
}

/**
 * A modal popup used to initialize a new project with a name and description.
 * Enforces project limits and provides loading states during creation.
 *
 * @param props - ProjectSetupPopupProps
 * @returns Portaled modal element
 */
export default function ProjectSetupPopup({
  open,
  onClose,
  onCreate,
}: ProjectSetupPopupProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ProjectType>("design");
  const [loading, setLoading] = useState(false);
  const projects = useProjectStore((s) => s.projects);
  const isLimitReached = projects.length >= MAX_PROJECTS;
  const canClose = projects.length > 0;

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isLimitReached) return;

    setLoading(true);
    setTimeout(() => {
      onCreate(name, type, description);
      setName("");
      setDescription("");
      setType("design");
      setLoading(false);
    }, 250);
  };

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={canClose ? onClose : undefined}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-card border border-border rounded-md shadow-xl animate-in zoom-in-98 duration-150 p-4.5 flex flex-col gap-3.5 z-10">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex flex-col gap-0.5">
            <h6 className="text-xs font-semibold text-foreground">Create New Project</h6>
            <p className="text-[11px] text-muted-foreground">
              Define your system architecture workspace
            </p>
          </div>
          {canClose && (
            <button
              onClick={onClose}
              type="button"
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <IconX size={15} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="name" className="text-[11px]">Project Name</Label>
            <Input
              autoFocus
              id="name"
              size="sm"
              placeholder="e.g. Payments Engine"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px]">Project Type</Label>
            <Tabs
              value={type}
              onValueChange={(val) => setType(val as ProjectType)}
              className="w-full"
            >
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="design">Architecture</TabsTrigger>
                <TabsTrigger value="c4">C4 Model</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="desc" className="text-[11px]">Description (Optional)</Label>
            <Textarea
              id="desc"
              rows={2}
              placeholder="Brief description of the system architecture..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
            {canClose && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              variant="default"
              type="submit"
              disabled={!name.trim() || loading || isLimitReached}
              className={cn(
                "min-w-28",
                isLimitReached && "bg-muted pointer-events-none text-muted-foreground",
              )}
              loading={loading}
            >
              {loading ? (
                "Initializing…"
              ) : isLimitReached ? (
                "Limit Reached"
              ) : (
                "Create Project"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
