/**
 * @fileoverview Custom ReactFlow connector edge with layered Nordic flow animation
 * (solid rail, animated stream, and travelling signal bead) and smart responsive label pill.
 */

import { useEffect, useRef, useState } from "react";
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";
import { updateEdgeMeta, useCanvasStore } from "@/store/canvas.store";
import { cn } from "@/lib/utils";

/**
 * Custom architectural connector edge with fluid animated signal flow
 * and a compact, hover-expanding editable label pill.
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
  const isExporting = useCanvasStore((s) => s.isExporting);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const labelText = ((data?.label as string) || "").trim();
  const [labelDraft, setLabelDraft] = useState(labelText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setLabelDraft(labelText);
    }
  }, [labelText, isEditing]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [labelDraft, isEditing]);

  const commitEdit = () => {
    setIsEditing(false);
    updateEdgeMeta(id, { label: labelDraft.trim() });
  };

  const isAnimated = animated || (data?.animated as boolean) !== false;
  const isActive = Boolean(selected || isHovered || isEditing);
  const hasLabel = labelText.length > 0;
  const showLabelPill = isEditing || hasLabel || (isActive && !isExporting);

  const baseStroke = isActive
    ? "var(--edge-stroke-selected, #171717)"
    : (style?.stroke as string) || "var(--edge-stroke, #a3a3a3)";

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Wide Invisible Interaction Hitbox */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={22}
        className="react-flow__edge-interaction cursor-pointer"
      />

      {/* Soft Ambient Halo on Hover / Select */}
      {isActive && !isExporting && (
        <path
          d={edgePath}
          fill="none"
          stroke="var(--edge-stroke-selected, #171717)"
          strokeOpacity={0.09}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* Crisp Solid Base Rail */}
      <BaseEdge
        id={id}
        path={edgePath}
        className={cn("react-flow__edge-path", selected && "edge-glow")}
        style={{
          ...style,
          stroke: baseStroke,
          strokeOpacity: isActive ? 0.9 : 0.45,
          strokeWidth: isActive ? 1.85 : 1.5,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          fill: "none",
        }}
        markerEnd={markerEnd}
      />

      {/* Animated Flowing Dash Stream Overlay */}
      {isAnimated && !isExporting && (
        <path
          d={edgePath}
          fill="none"
          stroke="var(--edge-stroke-selected, #171717)"
          strokeOpacity={isActive ? 0.85 : 0.38}
          strokeWidth={isActive ? 1.85 : 1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={
            isActive ? "nordic-edge-stream-active" : "nordic-edge-stream"
          }
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* Travelling Signal Pulse Bead (GPU-accelerated SVG motion) */}
      {isAnimated && !isExporting && (
        <g style={{ pointerEvents: "none" }}>
          <circle
            r={isActive ? 5.5 : 4.5}
            fill="var(--edge-stroke-selected, #171717)"
            fillOpacity={isActive ? 0.18 : 0.12}
          >
            <animateMotion
              dur={isActive ? "1.6s" : "2.6s"}
              repeatCount="indefinite"
              path={edgePath}
            />
          </circle>
          <circle
            r={isActive ? 2.6 : 2.1}
            fill="var(--edge-stroke-selected, #171717)"
            fillOpacity={isActive ? 0.95 : 0.65}
          >
            <animateMotion
              dur={isActive ? "1.6s" : "2.6s"}
              repeatCount="indefinite"
              path={edgePath}
            />
          </circle>
        </g>
      )}

      {/* Smart Responsive Label Pill */}
      {showLabelPill && (
        <EdgeLabelRenderer>
          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className={cn(
              "nodrag nopan select-none cursor-pointer transition-all duration-150",
              isEditing
                ? "z-50 w-[196px] nordic-panel rounded-xl px-2.5 py-1.5"
                : isActive
                  ? "z-40 max-w-[224px] nordic-pill rounded-xl px-2.5 py-1 text-[11px] font-medium text-foreground"
                  : "z-10 max-w-[144px] bg-card/95 backdrop-blur-xs border border-black/[0.07] dark:border-white/[0.08] rounded-full px-2.5 py-0.5 text-[10.5px] font-medium text-foreground/80 shadow-[0_1px_4px_rgba(0,0,0,0.04)]",
              !hasLabel && !isEditing && "border-dashed opacity-90",
            )}
          >
            {isEditing ? (
              <textarea
                ref={textareaRef}
                autoFocus
                rows={1}
                placeholder="Describe connection…"
                className="nodrag block w-full resize-none overflow-hidden bg-transparent text-[11.5px] leading-snug text-foreground placeholder:text-muted-foreground/70 p-0 outline-none border-none focus:ring-0 shadow-none text-center"
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    commitEdit();
                  }
                  if (e.key === "Escape") {
                    setLabelDraft(labelText);
                    setIsEditing(false);
                  }
                }}
              />
            ) : hasLabel ? (
              <span
                className={cn(
                  "block text-center leading-snug",
                  isActive
                    ? "whitespace-normal break-words"
                    : "truncate whitespace-nowrap",
                )}
              >
                {labelText}
              </span>
            ) : (
              <span className="block text-center text-[10px] text-muted-foreground whitespace-nowrap">
                + Add label
              </span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </g>
  );
}
