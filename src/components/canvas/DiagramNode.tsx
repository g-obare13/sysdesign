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
    color: "#2B5B7A",
    pill: "#E6EFF5",
    text: "#1E3F54",
    label: "Person",
    icon: "IconUser",
    dark: { color: "#78A9C8", pill: "#1C2E3C", text: "#D9E8F2" },
  },
  "c4-system": {
    color: "#2B4657",
    pill: "#E6ECEF",
    text: "#1C2E3A",
    label: "System",
    icon: "IconBox",
    dark: { color: "#8FB3C9", pill: "#1B2730", text: "#DCE7EE" },
  },
  "c4-container": {
    color: "#2F7270",
    pill: "#E3EFEF",
    text: "#1E4C4B",
    label: "Container",
    icon: "IconStack2",
    dark: { color: "#6EB5B2", pill: "#1A302F", text: "#D4ECEB" },
  },
  "c4-component": {
    color: "#52568A",
    pill: "#E8E9F3",
    text: "#35385C",
    label: "Component",
    icon: "IconPuzzle",
    dark: { color: "#9296C9", pill: "#222336", text: "#DFE0F2" },
  },
  "c4-external-system": {
    color: "#5A626A",
    pill: "#EAECEF",
    text: "#3B4046",
    label: "External",
    icon: "IconBox",
    dark: { color: "#9BA3AB", pill: "#23262A", text: "#E3E6E8" },
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
          "relative w-full h-full p-3 transition-all duration-150 rounded-xl",
          diagramMode === "c4"
            ? "bg-muted/25 border border-dashed border-border-strong/70"
            : "bg-muted/15 border border-dashed border-border-strong/60",
          selected && "border-primary/60 bg-primary/5 ring-2 ring-primary/15",
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
          "group relative flex flex-col bg-card text-foreground rounded-2xl border transition-all duration-150 min-w-[224px] max-w-[268px] select-none cursor-pointer overflow-visible",
          "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_18px_rgba(0,0,0,0.4)]",
          isExternal && "border-dashed opacity-95",
          selected
            ? "border-foreground/35 ring-2 ring-foreground/10 z-20"
            : "border-black/[0.06] dark:border-white/[0.07] hover:border-black/[0.12] dark:hover:border-white/[0.14]",
        )}
      >
        {/* Floating Quick Action Buttons on Hover & Select */}
        <div
          className={cn(
            "absolute -top-3.5 right-2 flex items-center gap-0.5 z-30 transition-all duration-150 bg-card/95 backdrop-blur-sm border border-border rounded-full px-1 py-0.5 shadow-sm",
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

        {/* Top Header Strip (Nordic Studio Two-Part Card) */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-muted/75 border-b border-border/60 rounded-t-[15px]">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[11.5px] font-medium text-foreground/80 truncate leading-none">
              {c4BadgeText || style.label}
            </span>
            {meta.status && (
              <span
                className={cn(
                  "size-1.5 rounded-full shrink-0",
                  meta.status === "existing" && "bg-[#3B6E5C]",
                  meta.status === "planned" && "bg-[#9A6B3B]",
                  meta.status === "deprecated" && "bg-[#A84A44]",
                )}
                title={`Status: ${meta.status}`}
              />
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openEdit();
            }}
            className="text-muted-foreground hover:text-foreground transition-colors p-0.5 -mr-1 rounded-md cursor-pointer"
            title="Edit node"
          >
            <TablerIcons.IconDotsVertical size={13} stroke={1.6} />
          </button>
        </div>

        {/* Card Body */}
        <div className="flex items-center gap-3 px-3.5 py-3 bg-card rounded-b-[15px]">
          {/* Monochrome Squircle Icon */}
          <div className="size-9 rounded-xl bg-muted/80 flex items-center justify-center shrink-0 text-foreground/75">
            <Icon size={16} stroke={1.6} />
          </div>

          {/* Node Labels Column */}
          <div className="flex flex-col min-w-0 flex-1 gap-0.5">
            <span className="text-[13px] font-semibold text-foreground truncate leading-tight">
              {meta.label || style.label}
            </span>
            <span className="text-[11.5px] text-muted-foreground truncate leading-tight">
              {meta.technology || meta.description || meta.subtype || style.label}
            </span>
          </div>
        </div>
      </div>

      {/* Node Edit Popup Modal */}
      {editing && <NodeEditModal nodeId={id} meta={meta} />}
    </>
  );
}

export default memo(DiagramNode);
