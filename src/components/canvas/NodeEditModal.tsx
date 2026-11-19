/**
 * @fileoverview Modal dialog for editing diagram node metadata (label, tech stack, C4 level, ownership, notes).
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { setEditingNodeId, updateNodeMeta } from "@/store/canvas.store";
import type { NodeMeta } from "@/types/diagram";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
        <div className="w-full max-w-md nordic-panel text-foreground rounded-xl shadow-popover overflow-hidden p-6 flex flex-col gap-4 animate-in zoom-in-98 duration-150 select-none">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-muted flex items-center justify-center text-foreground">
              <TablerIcons.IconAdjustmentsHorizontal size={16} stroke={1.6} />
            </div>
            <h3 className="text-card font-medium text-foreground">
              Configure node
            </h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleClose}
            aria-label="Close dialog"
            icon={<TablerIcons.IconX size={16} stroke={1.6} />}
          />
        </div>

        {/* Modal Body / Form Fields */}
        <div className="space-y-2.5">
          <div className="flex flex-col gap-1">
            <Label className="text-caption">Component Name</Label>
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
              <Label className="text-caption">Technology / Stack</Label>
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
              <Label className="text-caption">C4 Model Level</Label>
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
            <Checkbox
              id="is-external-cb"
              checked={draftIsExternal}
              onCheckedChange={(checked) => setDraftIsExternal(Boolean(checked))}
              className="cursor-pointer"
            />
            <Label
              htmlFor="is-external-cb"
              className="text-xs text-foreground/80 cursor-pointer select-none font-medium"
            >
              External System / Actor
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-caption">Owner / Team</Label>
              <Input
                size="sm"
                className="w-full text-xs"
                placeholder="Team or Service"
                value={draftOwner}
                onChange={(e) => setDraftOwner(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-caption">Status</Label>
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
            <Label className="text-caption">Notes & Guidance</Label>
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
          <Button size="sm" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
