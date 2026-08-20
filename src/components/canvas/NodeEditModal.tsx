/**
 * @fileoverview Modal dialog for editing diagram node metadata (label, tech stack, C4 level, ownership, notes).
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { setEditingNodeId, updateNodeMeta } from "@/store/canvas.store";
import type { NodeMeta } from "@/types/diagram";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import * as TablerIcons from "@tabler/icons-react";
import { Label } from "@/components/ui/label";

type Status = "existing" | "planned" | "deprecated" | "";

interface NodeEditModalProps {
  /** Unique ID of the node being edited */
  nodeId: string;
  /** Current metadata state of the node */
  meta: NodeMeta;
}

/**
 * Node property configuration modal dialog.
 *
 * @param props - NodeEditModalProps
 * @returns Portaled modal dialog element
 */
export default function NodeEditModal({ nodeId, meta }: NodeEditModalProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const [draftLabel, setDraftLabel] = React.useState(
    (meta.label as string) ?? "",
  );
  const [draftSubtype, setDraftSubtype] = React.useState(
    (meta.subtype as string) ?? "",
  );
  const [draftTechnology, setDraftTechnology] = React.useState(
    (meta.technology as string) ?? "",
  );
  const [draftC4Level, setDraftC4Level] = React.useState(
    (meta.c4Level as string) ?? "",
  );
  const [draftIsExternal, setDraftIsExternal] = React.useState(
    Boolean(meta.isExternal),
  );
  const [draftOwner, setDraftOwner] = React.useState(
    (meta.owner as string) ?? "",
  );
  const [draftNotes, setDraftNotes] = React.useState(
    (meta.notes as string) ?? "",
  );
  const [draftStatus, setDraftStatus] = React.useState<Status>(
    (meta.status as Status) ?? "",
  );

  const handleClose = () => {
    setEditingNodeId(null);
  };

  const handleSave = () => {
    const finalLabel = draftLabel.trim() || (meta.label as string);
    updateNodeMeta(nodeId, {
      label: finalLabel,
      subtype: draftSubtype.trim() || undefined,
      technology: draftTechnology.trim() || undefined,
      c4Level: (draftC4Level as any) || undefined,
      isExternal: draftIsExternal,
      owner: draftOwner.trim() || undefined,
      notes: draftNotes.trim() || undefined,
      status: draftStatus || undefined,
    });
    setEditingNodeId(null);
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-card text-foreground rounded-md border border-border shadow-xl overflow-hidden p-4.5 flex flex-col gap-3 animate-in zoom-in-98 duration-150 select-none">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-1.5">
            <div className="size-5 rounded-xs bg-primary/10 flex items-center justify-center text-primary">
              <TablerIcons.IconAdjustmentsHorizontal size={13} />
            </div>
            <h6 className="text-xs font-semibold text-foreground">
              Configure Node
            </h6>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <TablerIcons.IconX size={14} />
          </button>
        </div>

        {/* Modal Body / Form Fields */}
        <div className="space-y-2.5">
          <div className="flex flex-col gap-1">
            <Label className="text-[11px]">Component Name</Label>
            <Input
              autoFocus
              size="sm"
              className="w-full text-xs"
              placeholder="e.g. Primary DB"
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleClose();
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px]">Technology / Stack</Label>
              <Input
                size="sm"
                className="w-full font-mono text-xs"
                placeholder="e.g. PostgreSQL, Redis"
                value={draftTechnology || draftSubtype}
                onChange={(e) => {
                  setDraftTechnology(e.target.value);
                  setDraftSubtype(e.target.value);
                }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[11px]">C4 Model Level</Label>
              <Select
                value={draftC4Level}
                onValueChange={(val) => setDraftC4Level(val ?? "")}
              >
                <SelectTrigger size="sm" className="w-full text-xs">
                  <SelectValue placeholder="Level (Auto)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Standard Node</SelectItem>
                  <SelectItem value="context">L1 - System Context</SelectItem>
                  <SelectItem value="container">L2 - Container</SelectItem>
                  <SelectItem value="component">L3 - Component</SelectItem>
                  <SelectItem value="code">L4 - Code / Class</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 py-0.5">
            <input
              type="checkbox"
              id="is-external-cb"
              checked={draftIsExternal}
              onChange={(e) => setDraftIsExternal(e.target.checked)}
              className="accent-primary rounded size-3.5 cursor-pointer"
            />
            <label
              htmlFor="is-external-cb"
              className="text-xs text-foreground/80 cursor-pointer select-none font-medium"
            >
              External System / Actor
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px]">Owner / Team</Label>
              <Input
                size="sm"
                className="w-full text-xs"
                placeholder="Team or Service"
                value={draftOwner}
                onChange={(e) => setDraftOwner(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[11px]">Status</Label>
              <Select
                value={draftStatus}
                onValueChange={(val) => setDraftStatus(val as Status)}
              >
                <SelectTrigger size="sm" className="w-full text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="existing">Existing</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="deprecated">Deprecated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px]">Notes & Guidance</Label>
            <Textarea
              placeholder="Additional documentation notes…"
              rows={3}
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
              className="w-full resize-none text-xs"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="default" size="sm" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
