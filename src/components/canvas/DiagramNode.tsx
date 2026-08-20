/**
 * @fileoverview Custom ReactFlow diagram node component rendering styled architecture and C4 nodes,
 * group containers, interactive connection handles, and inline quick actions.
 */

import * as TablerIcons from "@tabler/icons-react";
import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { memo, useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  applyNodeChangesToStore,
  setC4Level,
  setEditingNodeId,
  updateNodeMeta,
  useCanvasStore,
} from "@/store/canvas.store";
import type { NodeMeta } from "@/types/diagram";
import { CATEGORY_STYLE } from "@/types/diagram";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import NodeEditModal from "./NodeEditModal";

type TablerIconComponent = React.FC<{
  size?: number;
  stroke?: number;
  color?: string;
  className?: string;
}>;

function getIcon(name: string): TablerIconComponent {
  const icons = TablerIcons as Record<string, unknown>;
  return (icons[name] as TablerIconComponent) ?? TablerIcons.IconBox;
}

type Status = "existing" | "planned" | "deprecated" | "";

interface C4Style {
  color: string;
  pill: string;
  text: string;
  label: string;
  icon: string;
  dark: { color: string; pill: string; text: string };
}

export const C4_STYLES: Record<string, C4Style> = {
  "c4-person": {
    color: "#0284c7",
    pill: "#e0f2fe",
    text: "#0369a1",
    label: "Person",
    icon: "IconUser",
    dark: { color: "#38bdf8", pill: "#0c4a6e30", text: "#e0f2fe" },
  },
  "c4-system": {
    color: "#1d70b8",
    pill: "#e0edfa",
    text: "#154e80",
    label: "System",
    icon: "IconBox",
    dark: { color: "#60a5fa", pill: "#1e3a8a30", text: "#dbeafe" },
  },
  "c4-container": {
    color: "#0d9488",
    pill: "#e0f5f3",
    text: "#096960",
    label: "Container",
    icon: "IconStack2",
    dark: { color: "#2dd4bf", pill: "#134e4a30", text: "#ccfbf1" },
  },
  "c4-component": {
    color: "#7c3aed",
    pill: "#eee6fb",
    text: "#5521b5",
    label: "Component",
    icon: "IconPuzzle",
    dark: { color: "#a78bfa", pill: "#4c1d9530", text: "#ede9fe" },
  },
  "c4-external-system": {
    color: "#64748b",
    pill: "#eaf0f4",
    text: "#334155",
    label: "External",
    icon: "IconBox",
    dark: { color: "#94a3b8", pill: "#33415530", text: "#f1f5f9" },
  },
};

export function getC4Style(subtype: string): C4Style {
  if (subtype.includes("external")) return C4_STYLES["c4-external-system"];
  if (subtype.includes("person")) return C4_STYLES["c4-person"];
  if (
    subtype.includes("container") ||
    subtype.includes("app") ||
    subtype.includes("microservice") ||
    subtype.includes("db") ||
    subtype.includes("api")
  )
    return C4_STYLES["c4-container"];
  if (
    subtype.includes("component") ||
    subtype.includes("service") ||
    subtype.includes("repository")
  )
    return C4_STYLES["c4-component"];
  return C4_STYLES["c4-system"];
}

/**
 * Diagram node view component supporting standard architecture nodes, C4 hierarchical nodes, and group boundaries.
 *
 * @param props - ReactFlow NodeProps
 * @returns ReactFlow node element
 */
function DiagramNode({ id, data, selected, type }: NodeProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const meta = data as NodeMeta;
  const category = meta.category || "microservice";
  const subtype = meta.subtype || "";
  const isC4 =
    category === "c4" ||
    subtype.startsWith("c4-") ||
    meta.c4Level !== undefined;

  const c4Style = isC4 ? getC4Style(subtype) : null;
  const baseStyle = isC4
    ? {
        color: c4Style!.color,
        pill: c4Style!.pill,
        text: c4Style!.text,
        label: c4Style!.label,
        dark: c4Style!.dark,
      }
    : CATEGORY_STYLE[category as keyof typeof CATEGORY_STYLE];
  const darkVariant =
    baseStyle && "dark" in baseStyle ? baseStyle.dark : undefined;
  const style = {
    color: (isDark && darkVariant?.color) || baseStyle?.color || "#5e6a50",
    pill: (isDark && darkVariant?.pill) || baseStyle?.pill || "var(--muted)",
    text:
      (isDark && darkVariant?.text) || baseStyle?.text || "var(--foreground)",
    label: baseStyle?.label || category,
  };

  const iconName = meta.icon || (isC4 ? c4Style!.icon : "IconBox");
  const Icon = getIcon(iconName);

  const globalEditingId = useCanvasStore((s) => s.editingNodeId);
  const diagramMode = useCanvasStore((s) => s.diagramMode);
  const editing = globalEditingId === id;

  const [draft, setDraft] = useState((meta.label as string) ?? "");
  const [draftNotes, setDraftNotes] = useState((meta.notes as string) ?? "");
  const [draftOwner, setDraftOwner] = useState((meta.owner as string) ?? "");
  const [draftStatus, setDraftStatus] = useState<Status>(
    (meta.status as Status) ?? "",
  );

  const openEdit = useCallback(() => {
    setDraft((meta.label as string) ?? "");
    setDraftNotes((meta.notes as string) ?? "");
    setDraftOwner((meta.owner as string) ?? "");
    setDraftStatus((meta.status as Status) ?? "");
    setEditingNodeId(id);
  }, [id, meta.label, meta.notes, meta.owner, meta.status]);

  const closeEdit = useCallback(() => {
    setEditingNodeId(null);
  }, []);

  const commitEdit = useCallback(() => {
    setEditingNodeId(null);
    const finalLabel = draft.trim() || (meta.label as string);
    setDraft(finalLabel);
    updateNodeMeta(id, {
      label: finalLabel,
      notes: draftNotes.trim() || undefined,
      owner: draftOwner.trim() || undefined,
      status: draftStatus || undefined,
    });
  }, [id, draft, draftNotes, draftOwner, draftStatus, meta.label]);

  const handleStyle: React.CSSProperties = {
    width: 7,
    height: 7,
    background: "var(--card)",
    border: "1px solid var(--primary)",
    borderRadius: "50%",
  };

  const isGroup = type === "group";

  if (isGroup) {
    return (
      <div
        className={cn(
          "relative w-full h-full p-2.5 transition-colors duration-150 rounded-md",
          diagramMode === "c4"
            ? "bg-muted/10 border border-dashed border-border/50"
            : "bg-muted/5 border border-dashed border-border/40",
          selected && "border-primary/60 bg-primary/5 ring-1 ring-primary/20",
        )}
      >
        <Handle
          type="target"
          position={Position.Top}
          id="top-t"
          style={handleStyle}
        />
        <Handle
          type="source"
          position={Position.Top}
          id="top-s"
          style={handleStyle}
        />
        <Handle
          type="target"
          position={Position.Left}
          id="left-t"
          style={handleStyle}
        />
        <Handle
          type="source"
          position={Position.Left}
          id="left-s"
          style={handleStyle}
        />
        <Handle
          type="target"
          position={Position.Right}
          id="right-t"
          style={handleStyle}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right-s"
          style={handleStyle}
        />
        <Handle
          type="target"
          position={Position.Bottom}
          id="bottom-t"
          style={handleStyle}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom-s"
          style={handleStyle}
        />
        <div
          onDoubleClick={openEdit}
          className="flex items-start w-full opacity-70"
        >
          {editing ? (
            <div className="flex flex-col gap-1">
              <Input
                autoFocus
                size="xs"
                className="nodrag text-[10px] h-5"
                placeholder="Group name"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit();
                  if (e.key === "Escape") closeEdit();
                }}
              />
              <Button
                onClick={commitEdit}
                size="xs"
                className="h-5 text-[9px] nodrag cursor-pointer"
              >
                Save
              </Button>
            </div>
          ) : (
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider cursor-text text-foreground/70 truncate leading-tight">
              {meta.label as string}
            </span>
          )}
        </div>
      </div>
    );
  }

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      applyNodeChangesToStore([{ id, type: "remove" }]);
    },
    [id],
  );

  const isContainer =
    meta.subtype === "c4-container" || meta.c4Level === "container";
  const isExternal = Boolean(meta.isExternal);

  let c4BadgeText = "";
  if (isC4) {
    if (meta.subtype === "c4-person")
      c4BadgeText = isExternal ? "[External Person]" : "[Person]";
    else if (meta.subtype === "c4-system")
      c4BadgeText = isExternal ? "[External System]" : "[Software System]";
    else if (meta.subtype === "c4-container")
      c4BadgeText = `[Container${meta.technology ? `: ${meta.technology}` : ""}]`;
    else if (meta.subtype === "c4-component")
      c4BadgeText = `[Component${meta.technology ? `: ${meta.technology}` : ""}]`;
    else if (meta.c4Level) c4BadgeText = `[${meta.c4Level.toUpperCase()}]`;
  }

  return (
    <>
      <div
        className={cn(
          "group relative flex items-center gap-2 px-2.5 py-2 bg-card text-foreground rounded-md border transition-colors duration-150 min-w-[190px] max-w-[240px] select-none cursor-pointer shadow-none",
          isExternal && "border-dashed opacity-90",
          selected
            ? "border-primary ring-1 ring-primary/40 z-20"
            : "border-border hover:border-border-strong",
        )}
      >
        {/* Floating Quick Action Buttons on Hover & Select */}
        <div
          className={cn(
            "absolute -top-2.5 right-1 flex items-center gap-0.5 z-30 transition-opacity duration-150",
            selected
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto",
          )}
        >
          {isContainer && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    icon={<TablerIcons.IconHierarchy size={11} stroke={1.8} />}
                    iconPlacement="left"
                    onClick={(e) => {
                      e.stopPropagation();
                      setC4Level("component");
                    }}
                    className="size-5 rounded-xs bg-card"
                  />
                }
              />
              <TooltipContent side="top">Drill down (L3)</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  icon={<TablerIcons.IconPencil size={11} stroke={1.8} />}
                  iconPlacement="left"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit();
                  }}
                  className="size-5 rounded-xs bg-card"
                />
              }
            />
            <TooltipContent side="top">Edit properties</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="destructive"
                  size="icon"
                  icon={<TablerIcons.IconTrash size={11} stroke={1.8} />}
                  iconPlacement="left"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(e);
                  }}
                  className="size-5 rounded-xs bg-card "
                />
              }
            />
            <TooltipContent side="top">Delete node</TooltipContent>
          </Tooltip>
        </div>

        {/* Handles for Edge Connections */}
        <Handle
          type="target"
          position={Position.Top}
          id="top-t"
          style={handleStyle}
        />
        <Handle
          type="source"
          position={Position.Top}
          id="top-s"
          style={handleStyle}
        />
        <Handle
          type="target"
          position={Position.Left}
          id="left-t"
          style={handleStyle}
        />
        <Handle
          type="source"
          position={Position.Left}
          id="left-s"
          style={handleStyle}
        />
        <Handle
          type="target"
          position={Position.Right}
          id="right-t"
          style={handleStyle}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right-s"
          style={handleStyle}
        />
        <Handle
          type="target"
          position={Position.Bottom}
          id="bottom-t"
          style={handleStyle}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom-s"
          style={handleStyle}
        />

        {/* Soft-tinted Category Icon Circle */}
        <div
          className="size-6 rounded-full flex items-center justify-center shrink-0"
          style={{
            backgroundColor: style.pill,
            color: style.color,
          }}
        >
          <Icon size={13} stroke={2} />
        </div>

        {/* Node Labels Column */}
        <div className="flex flex-col min-w-0 flex-1">
          {c4BadgeText && (
            <span className="font-mono text-[9px] text-primary font-medium  truncate leading-none mb-0.5">
              {c4BadgeText}
            </span>
          )}
          <span className="text-xs font-semibold text-foreground truncate">
            {meta.label || style.label}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground truncate">
            {meta.technology || meta.subtype || style.label}
          </span>
        </div>
      </div>

      {/* Node Edit Popup Modal */}
      {editing && <NodeEditModal nodeId={id} meta={meta} />}
    </>
  );
}

export default memo(DiagramNode);
