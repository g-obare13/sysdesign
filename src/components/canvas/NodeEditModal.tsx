import * as React from "react";
import { createPortal } from "react-dom";
import { setEditingNodeId, updateNodeMeta } from "../../store/canvas.store";
import type { NodeMeta } from "../../types/diagram";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import * as TablerIcons from "@tabler/icons-react";
import { Label } from "../ui/label";

type Status = "existing" | "planned" | "deprecated" | "";

interface NodeEditModalProps {
  nodeId: string;
  meta: NodeMeta;
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-card text-foreground rounded-2xl border border-border shadow-2xl overflow-hidden p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150 select-none">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <TablerIcons.IconAdjustmentsHorizontal
              size={18}
              className="text-primary"
            />
            <h6>Configure Component</h6>
          </div>
          <Button
            variant={"outline"}
            onClick={handleClose}
            className="text-foreground cursor-pointer transition-colors rounded-full"
          >
            <TablerIcons.IconX size={16} />
          </Button>
        </div>

        {/* Modal Body / Form Fields */}
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <Label>Component Name / Title</Label>
            <Input
              autoFocus
              className="w-full font-sans"
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
            <div className="flex flex-col gap-2">
              <Label>Technology / Stack</Label>
              <Input
                className="w-full font-mono text-xs"
                placeholder="e.g. Go, React, PostgreSQL"
                value={draftTechnology || draftSubtype}
                onChange={(e) => {
                  setDraftTechnology(e.target.value);
                  setDraftSubtype(e.target.value);
                }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>C4 Model Level</Label>
              <Select
                value={draftC4Level}
                onValueChange={(val) => setDraftC4Level(val ?? "")}
              >
                <SelectTrigger className="w-full text-xs!">
                  <SelectValue placeholder="Level (Auto)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Standard Node</SelectItem>
                  <SelectItem value="context">L1 — System Context</SelectItem>
                  <SelectItem value="container">L2 — Container</SelectItem>
                  <SelectItem value="component">L3 — Component</SelectItem>
                  <SelectItem value="code">L4 — Code / Class</SelectItem>
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
              className="text-xs text-foreground cursor-pointer select-none font-medium"
            >
              External System / Actor (Outside system boundary)
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-2">
              <Label>Owner</Label>
              <Input
                className="w-full font-sans text-xs"
                placeholder="Team / Service"
                value={draftOwner}
                onChange={(e) => setDraftOwner(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select
                value={draftStatus}
                onValueChange={(val) => setDraftStatus(val as Status)}
              >
                <SelectTrigger className="w-full text-xs!">
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

          <div className="flex flex-col gap-2">
            <Label>Notes & Guidance</Label>
            <Textarea
              placeholder="Additional documentation notes…"
              rows={3}
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
              className="w-full resize-none font-sans text-xs"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 ">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="shiny" size="sm" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
