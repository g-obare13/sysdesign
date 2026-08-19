/**
 * @fileoverview Custom ReactFlow edge renderer with editable inline label pill and animated stroke.
 */

import { useState, useEffect, useRef } from "react";
import {
  BaseEdge,
  getBezierPath,
  EdgeLabelRenderer,
  type EdgeProps,
} from "@xyflow/react";
import { updateEdgeMeta } from "@/store/canvas.store";
import { cn } from "@/lib/utils";

/**
 * Custom edge component for the diagram.
 * Renders an animated bezier path with an editable label in the center.
 *
 * @param props - ReactFlow EdgeProps
 * @returns ReactFlow Diagram Edge element
 */
export default function DiagramEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
  markerEnd,
  selected,
  animated = true,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [labelDraft, setLabelDraft] = useState((data?.label as string) || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setLabelDraft((data?.label as string) || "");
    }
  }, [data?.label, isEditing]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [labelDraft, isEditing]);

  const commitEdit = () => {
    setIsEditing(false);
    updateEdgeMeta(id, { label: labelDraft });
  };

  const isAnimated = animated || (data?.animated as boolean) !== false;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={cn(
          isAnimated && "edge-animated",
          selected && "edge-glow",
        )}
        style={{
          stroke: "var(--primary)",
          strokeWidth: selected ? 2 : 1.5,
          opacity: selected ? 1 : 0.85,
          ...style,
        }}
        markerEnd={markerEnd}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: "var(--card)",
            color: "var(--foreground)",
            pointerEvents: "all",
            cursor: "pointer",
            zIndex: 10,
            maxWidth: "160px",
          }}
          className={cn(
            "nodrag nopan rounded-full px-2.5 py-0.5 border border-border/80 text-[10px] font-mono shadow-xs transition-all",
            selected && "border-primary ring-2 ring-primary/20",
          )}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          {isEditing ? (
            <textarea
              ref={textareaRef}
              autoFocus
              rows={1}
              className="nodrag w-full resize-none overflow-hidden bg-transparent text-[10px] font-mono p-0 outline-none border-none focus:ring-0 shadow-none text-center"
              value={labelDraft}
              onChange={(e) => setLabelDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  commitEdit();
                }
                if (e.key === "Escape") {
                  setLabelDraft((data?.label as string) || "");
                  setIsEditing(false);
                }
              }}
            />
          ) : (
            <span className="block w-full text-center truncate">
              {(data?.label as string) || (
                <span className="text-muted-foreground/60 text-[9px]">
                  + label
                </span>
              )}
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
