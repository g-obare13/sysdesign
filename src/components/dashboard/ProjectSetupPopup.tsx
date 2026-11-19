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
        className="absolute inset-0 bg-background/70 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={canClose ? onClose : undefined}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md nordic-panel rounded-xl shadow-popover animate-in zoom-in-98 duration-150 p-6 flex flex-col gap-4 z-10">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex flex-col gap-1">
            <h3 className="text-card font-medium text-foreground">Create new project</h3>
            <p className="text-small text-muted-foreground">
              Define your system architecture workspace
            </p>
          </div>
          {canClose && (
            <Button
              variant="ghost"
              onClick={onClose}
              type="button"
              size="icon-sm"
              aria-label="Close dialog"
              icon={<IconX size={16} stroke={1.6} />}
            />
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="name" className="text-caption">Project Name</Label>
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
            <Label className="text-caption">Project Type</Label>
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
            <Label htmlFor="desc" className="text-caption">Description (Optional)</Label>
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
                variant="outline"
                type="button"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </Button>
            )}
            <Button
              size="sm"
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
