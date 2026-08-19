import { useState } from "react";
import { createPortal } from "react-dom";
import { IconFolderPlus, IconX } from "@tabler/icons-react";
import {
  useProjectStore,
  MAX_PROJECTS,
  type ProjectType,
} from "../../store/project.store";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { cn } from "../../lib/utils";
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
    }, 400);
  };

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={canClose ? onClose : undefined}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-card border border-border/80 rounded-3xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 p-6 flex flex-col gap-5 z-10">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-start gap-2">
            <h4>Create New Project</h4>
            <p>Start by naming your architecture design</p>
          </div>
          {canClose && (
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
            >
              <IconX size={18} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Project Name</Label>
            <Input
              autoFocus
              id="name"
              size={"lg"}
              placeholder="e.g. Payments Engine"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Project Type</Label>
            <Tabs
              value={type}
              onValueChange={(val) => setType(val as ProjectType)}
              className="w-full"
            >
              <TabsList className="w-full grid grid-cols-2 border">
                <TabsTrigger value="design">Architecture</TabsTrigger>
                <TabsTrigger value="c4">C4 Model</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="desc">Description (Optional)</Label>
            <Textarea
              id="desc"
              rows={2}
              placeholder="Brief description of the system architecture..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 mt-2">
            <Button
              icon={IconFolderPlus}
              iconPlacement="right"
              size={"pill"}
              variant={"shiny"}
              type="submit"
              disabled={!name.trim() || loading || isLimitReached}
              className={cn(
                "w-full ",
                isLimitReached ? "bg-muted pointer-events-none" : "",
              )}
              loading={loading}
            >
              {loading ? (
                <>Initialising Project...</>
              ) : isLimitReached ? (
                "Project Limit Reached"
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
