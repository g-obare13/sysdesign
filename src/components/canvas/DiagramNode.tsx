import * as TablerIcons from "@tabler/icons-react";
import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { memo, useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "../../lib/utils";
import {
  updateNodeMeta,
  setEditingNodeId,
  useCanvasStore,
} from "../../store/canvas.store";
import type { NodeMeta } from "../../types/diagram";
import { CATEGORY_STYLE } from "../../types/diagram";
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
import { IconPencilBolt } from "@tabler/icons-react";

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

const STATUS_CONFIG: Record<
  Exclude<Status, "">,
  { label: string; className: string }
> = {
  existing: { label: "Existing", className: "bg-[#0ea5e9] text-white" },
  planned: { label: "Planned", className: "bg-[#c57642] text-white" },
  deprecated: { label: "Deprecated", className: "bg-[#da1e28] text-white" },
};

//  C4 abstraction styles — formal tones
interface C4Style {
  color: string; // main accent color (icon, handles, borders)
  pill: string; // icon pill background
  text: string; // category label text color
  label: string; // display name of the abstraction
  icon: string; // default icon when none provided
  dark: { color: string; pill: string; text: string }; // dark-mode variant
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

//  Main DiagramNode
function DiagramNode({ id, data, selected, type }: NodeProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const meta = data as NodeMeta;
  const category = meta.category || "microservice";
  const subtype = meta.subtype || "";
  const isC4 = category === "c4";

  // For C4 nodes use C4 style config; for others use CATEGORY_STYLE
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
  const style = {
    color: isDark ? baseStyle.dark.color : baseStyle.color,
    pill: isDark ? baseStyle.dark.pill : baseStyle.pill,
    text: isDark ? baseStyle.dark.text : baseStyle.text,
    label: baseStyle.label,
  };

  // Resolve icon: C4 may override icon from meta or use C4Style default
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
    border: `1.5px solid ${style.color}`,
    borderRadius: "10px",
  };

  const status = (meta.status as Status) || "";
  const statusCfg = status ? STATUS_CONFIG[status] : null;

  const isShape = subtype.startsWith("sh-");
  const isGroup = type === "group";
  const isFlow =
    (meta.category === "flow" || meta.category === "shape") &&
    !isGroup &&
    !isC4;

  //  Shape geometry
  let shapeClass = "rounded-xs";
  let shapeStyle: React.CSSProperties = {};

  if (!isC4 && !isFlow && !isGroup) {
    if (subtype === "sh-flow-diamond") {
      shapeClass = "";
      shapeStyle = { clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" };
    } else if (subtype === "sh-flow-circle") {
      shapeClass =
        "rounded-full aspect-square flex flex-col items-center justify-center p-4";
    } else if (subtype === "sh-flow-para") {
      shapeClass = "";
      shapeStyle = { clipPath: "polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)" };
    } else if (subtype === "sh-flow-hex") {
      shapeClass = "";
      shapeStyle = {
        clipPath:
          "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
      };
    } else if (subtype === "sh-flow-oval") {
      shapeClass = "rounded-full px-6";
    } else if (subtype === "sh-sticky") {
      shapeClass = "rounded-none rotate-1 shadow-md p-4";
      shapeStyle = {
        background: "#fef9c3",
        color: "#161616",
        borderColor: "#facc15",
      };
    } else if (subtype === "sh-flow-cylinder") {
      shapeClass = "rounded-[30%]";
    }
  }

  //  Group node
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

  //  Shared card renderer for both Architecture + C4 nodes
  // C4 nodes use the exact same card design as architecture nodes.
  // The only differences are: color config, abstraction label, and (for Person) a circle icon pill.
  const nodeColorVar = subtype === "sh-sticky" ? "#facc15" : style.color;

  return (
    <div
      className={cn(
        "relative transition-all duration-150 px-3 py-2.5 border rounded-[--radius]",
        shapeClass,
        editing
          ? "min-w-[220px] max-w-[240px]"
          : isFlow
            ? "min-w-[160px] flex flex-col items-center justify-center p-3 text-center"
            : isC4
              ? "min-w-[148px] max-w-[190px]"
              : "min-w-[148px] max-w-[190px]",
        selected
          ? "border-(--node-color) bg-[color-mix(in_srgb,var(--node-color)_6%,var(--card))] shadow-[0_0_0_3px_color-mix(in_srgb,var(--node-color)_20%,transparent)]"
          : cn(
              "bg-card border-border shadow-[0_1px_4px_rgba(0,0,0,0.07)]",
              subtype === "sh-sticky" && "border-yellow-400 bg-yellow-100/50",
            ),
      )}
      style={
        {
          ...shapeStyle,
          "--node-color": nodeColorVar,
        } as React.CSSProperties
      }
    >
      {statusCfg && !editing && (
        <div
          className={cn(
            "absolute -top-2 -right-2 shrink-0 text-[8.5px] font-semibold px-1.5 py-0.5 rounded-full leading-none z-10",
            statusCfg.className,
          )}
        >
          {statusCfg.label}
        </div>
      )}

      {/* Handles */}
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

      {/* Header row: icon pill + category/abstraction label */}
      {!isFlow && (
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <div
              className={cn(
                "size-4 rounded-md flex items-center justify-center shrink-0",
                // Person gets a circle pill to hint at the avatar shape
                isC4 && subtype === "c4-person" && "rounded-full",
              )}
              style={{ background: style.pill, color: style.color }}
            >
              <Icon size={8} stroke={1.8} />
            </div>
            <h6
              className="text-[8px] font-medium tracking-widest truncate"
              style={{
                color: subtype === "sh-sticky" ? "#854f0b" : style.text,
              }}
            >
              {isShape ? "Note" : style.label}
            </h6>
          </div>
        </div>
      )}

      {/* Edit form */}
      {editing ? (
        <div className="flex flex-col gap-2 mt-1">
          <Input
            autoFocus
            size="xs"
            className="nodrag py-1! text-[6px]!"
            placeholder="Label"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") closeEdit();
            }}
          />
          <Input
            size="xs"
            className="nodrag py-1! text-[6px]!"
            placeholder={isC4 ? "Technology / role" : "Owner (e.g. Auth Team)"}
            value={draftOwner}
            onChange={(e) => setDraftOwner(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
            }}
          />
          <Textarea
            placeholder={isC4 ? "Description…" : "Notes… (Shift+Enter to save)"}
            value={draftNotes}
            rows={4}
            className="resize-none nodrag px-2 py-1 text-[6px]! leading-tight min-h-4"
            onChange={(e) => setDraftNotes(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.shiftKey) {
                e.preventDefault();
                commitEdit();
              }
            }}
          />
          <Select
            value={draftStatus}
            onValueChange={(val) => setDraftStatus(val as Status)}
          >
            <SelectTrigger
              size="xs"
              className="w-full nodrag text-[6px]! py-1! h-1"
            >
              <SelectValue
                placeholder="No status"
                className="text-[6px]! h-4!"
              />
            </SelectTrigger>
            <SelectContent className="nodrag">
              <SelectItem value="">No status</SelectItem>
              <SelectItem value="existing">Existing</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="deprecated">Deprecated</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={commitEdit}
            variant="default"
            size="sm"
            className="w-full text-[6px]! h-6 active:scale-[0.98] transition-all cursor-pointer nodrag"
          >
            Save
          </Button>
        </div>
      ) : (
        /* Read view */
        <div
          onDoubleClick={openEdit}
          className={cn(
            "cursor-text h-full",
            isFlow && "flex flex-col items-center justify-center",
          )}
        >
          <div
            className={cn(
              "flex flex-wrap gap-1 items-center",
              isFlow && "justify-center",
            )}
          >
            {!isFlow && <IconPencilBolt size={8} stroke={1.8} />}
            <h6
              className={cn(
                "font-semibold wrap-break-word leading-tight",
                isFlow ? "text-sm text-[8px]" : "text-[8px]",
              )}
            >
              {meta.label as string}
            </h6>
          </div>

          {/* Description/notes shown for C4 and regular nodes */}
          {(meta.description || meta.notes) && !isFlow && (
            <div className="text-[7px] text-muted-foreground mt-0.5 leading-snug">
              {
                (isC4
                  ? meta.notes || meta.description
                  : meta.description) as string
              }
            </div>
          )}

          {/* Owner / tech badge */}
          {meta.owner && !isFlow && (
            <div
              className="text-[7px] font-semibold mt-1"
              style={{ color: style.color }}
            >
              {isC4 ? `[${meta.owner as string}]` : `@${meta.owner as string}`}
            </div>
          )}

          {/* Notes indicator for non-C4 */}
          {meta.notes && !isC4 && !isFlow && (
            <div className="mt-1.5 pt-1.5 border-t border-dashed border-border flex flex-col gap-0.5">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <TablerIcons.IconNotes size={10} stroke={2} />
                <span className="text-[7px]">Notes attached</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(DiagramNode);
