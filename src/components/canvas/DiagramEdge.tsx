/**
 * @fileoverview Custom ReactFlow edge renderer with editable inline label pill and animated stroke.
 */

import { useEffect, useRef, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  
  getSmoothStepPath
} from "@xyflow/react";
import type {EdgeProps} from "@xyflow/react";
import { updateEdgeMeta } from "@/store/canvas.store";
import { cn } from "@/lib/utils";

/**
 * Custom edge component for the diagram.
 * Renders an animated smoothstep path with an editable label in the center.
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
  style = {},
  markerEnd,
  selected,
  animated = true,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
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
  const strokeColor = selected
    ? "var(--edge-stroke-selected, #5e6a50)"
    : "var(--edge-stroke, #8e9584)";

  return (
    <>
      {/* Interaction Hitbox Path */}
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={20}
        className="react-flow__edge-interaction cursor-pointer"
      />

      <BaseEdge
        id={id}
        path={edgePath}
        className={cn(
          "react-flow__edge-path",
          isAnimated && "edge-animated",
          selected && "edge-glow",
        )}
        style={{
          strokeWidth: selected ? 2 : 1.5,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          fill: "none",
          ...style,
          stroke: selected
            ? "var(--edge-stroke-selected, #5e6a50)"
            : (style?.stroke as string) || strokeColor,
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
            maxWidth: "180px",
          }}
          className={cn(
            "nodrag nopan rounded-full px-2 py-1 border border-border text-[9.5px] font-mono shadow-none transition-colors select-none",
            selected
              ? "border-primary ring-1 ring-primary/40 text-primary font-medium"
              : "hover:border-border-strong text-foreground/80",
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
              className="nodrag w-full resize-none overflow-hidden bg-transparent text-[9px] p-0 outline-none border-none focus:ring-0 shadow-none text-center"
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
                <span className="text-muted-foreground/50 text-[9px]">
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
