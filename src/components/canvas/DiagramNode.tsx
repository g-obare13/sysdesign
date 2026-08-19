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
  updateNodeMeta,
  setEditingNodeId,
  setC4Level,
  useCanvasStore,
  applyNodeChangesToStore,
} from "@/store/canvas.store";
import type { NodeMeta } from "@/types/diagram";
import { CATEGORY_STYLE } from "@/types/diagram";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const C4_STYLES: Record<string, C4Style> = {
  "c4-person": {
    color: "#c57642",
    pill: "#edf5ff",
    text: "#c57642",
    label: "Person",
    icon: "IconUser",
    dark: { color: "#E9A87E", pill: "#3A2A20", text: "#F0C4A0" },
  },
  "c4-system": {
    color: "#c57642",
    pill: "#edf5ff",
    text: "#c57642",
    label: "System",
    icon: "IconBox",
    dark: { color: "#E9A87E", pill: "#3A2A20", text: "#F0C4A0" },
  },
  "c4-container": {
    color: "#198038",
    pill: "#defbe6",
    text: "#0e6027",
    label: "Container",
    icon: "IconStack2",
    dark: { color: "#42BE65", pill: "#14301E", text: "#7FE0A0" },
  },
  "c4-component": {
    color: "#d12771",
    pill: "#fff0f7",
    text: "#9f1853",
    label: "Component",
    icon: "IconPuzzle",
    dark: { color: "#EE6FA8", pill: "#3A2030", text: "#F5A8CC" },
  },
  "c4-external-system": {
    color: "#525252",
    pill: "#f4f4f4",
    text: "#161616",
    label: "External",
    icon: "IconBox",
    dark: { color: "#A8A8A8", pill: "#2E2E2E", text: "#C6C6C6" },
  },
};

function getC4Style(subtype: string): C4Style {
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
    color: (isDark && darkVariant?.color) || baseStyle?.color || "#888888",
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
    width: 6,
    height: 6,
    background: "var(--card)",
    border: "1.5px solid var(--primary)",
    borderRadius: "10px",
  };

  const isGroup = type === "group";

  if (isGroup) {
    return (
      <div
        className={cn(
          "relative w-full h-full p-4! transition-all duration-150 rounded-[--radius]",
          diagramMode === "c4"
            ? "bg-muted/10 border-2 border-dashed border-muted-foreground/40"
            : "bg-muted/5 border border-dashed border-muted-foreground/30",
          selected && "border-primary/60 bg-primary/5",
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
          className="flex items-start w-full opacity-60"
        >
          {editing ? (
            <div className="flex flex-col gap-1.5">
              <Input
                autoFocus
                size="xs"
                className="nodrag py-1! text-[10px]!"
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
                variant="default"
                size="sm"
                className="text-[9px]! h-5 nodrag cursor-pointer"
              >
                Save
              </Button>
            </div>
          ) : (
            <h6 className="text-[9px] font-medium uppercase tracking-widest cursor-text text-foreground wrap-break-word leading-tight">
              {meta.label as string}
            </h6>
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
          "group relative flex items-center gap-3.5 px-4 py-3 bg-card text-foreground rounded-2xl border transition-all duration-200 min-w-[210px] max-w-[260px] select-none cursor-pointer",
          isExternal && "border-dashed opacity-85",
          selected
            ? "border-primary ring-3 ring-primary/20 shadow-md z-20"
            : "border-border/80 hover:border-border hover:shadow-md shadow-xs",
        )}
      >
        {/* Floating Actions on Hover & Select: Edit, Drilldown, and Delete buttons */}
        <div
          className={cn(
            "absolute -top-3.5 -right-2 flex items-center gap-1 z-30 transition-all duration-150",
            selected
              ? "opacity-100 pointer-events-auto scale-100"
              : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-hover:scale-100 scale-95",
          )}
        >
          {isContainer && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setC4Level("component");
              }}
              title="Drill down to Components (L3)"
              className="w-7 h-7 rounded-lg bg-card border border-border shadow-md flex items-center justify-center cursor-pointer text-primary hover:bg-primary/10 transition-all hover:scale-105"
            >
              <TablerIcons.IconHierarchy size={13} stroke={1.8} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit();
            }}
            title="Edit properties"
            className="w-7 h-7 rounded-lg bg-card border border-border shadow-md flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted hover:border-primary/40 transition-all hover:scale-105"
          >
            <TablerIcons.IconPencil size={13} stroke={1.8} />
          </button>
          <button
            onClick={handleDelete}
            title="Delete node"
            className="w-7 h-7 rounded-lg bg-card border border-border shadow-md flex items-center justify-center cursor-pointer text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-all hover:scale-105"
          >
            <TablerIcons.IconTrash size={13} stroke={1.8} />
          </button>
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

        {/* Left Squircle Icon Container */}
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-slate-600 dark:bg-slate-700 text-white shadow-xs"
          style={{
            background: `color-mix(in srgb, ${style.color} 80%, #334155)`,
          }}
        >
          <Icon size={20} stroke={1.8} color="white" />
        </div>

        {/* Node Labels Column */}
        <div className="flex flex-col min-w-0 flex-1">
          {c4BadgeText && (
            <span className="font-mono text-[9px] text-primary/85 font-semibold tracking-tight truncate leading-none mb-0.5">
              {c4BadgeText}
            </span>
          )}
          <h6 className="text-sm truncate">{meta.label || style.label}</h6>
          <span className="font-mono text-xs text-muted-foreground leading-tight truncate">
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
