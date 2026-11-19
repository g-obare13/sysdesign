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
  source,
  target,
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
  const allEdges = useCanvasStore((s) => s.edges);
  const allNodes = useCanvasStore((s) => s.nodes);

  // Separate parallel / fan-out / fan-in corridors and anchor labels onto
  // each edge's own dedicated segment so labels never stack on top of one another
  // and never sit on top of a node card.
  const outSiblings = allEdges.filter((e) => e.source === source);
  const inSiblings = allEdges.filter((e) => e.target === target);
  const samePair = allEdges.filter(
    (e) =>
      (e.source === source && e.target === target) ||
      (e.source === target && e.target === source),
  );
  const outIndex = Math.max(0, outSiblings.findIndex((e) => e.id === id));
  const inIndex = Math.max(0, inSiblings.findIndex((e) => e.id === id));
  const pairIndex = Math.max(0, samePair.findIndex((e) => e.id === id));

  const isHorizontal =
    (sourcePosition === "right" || sourcePosition === "left") &&
    (targetPosition === "left" || targetPosition === "right");
  const isVertical =
    (sourcePosition === "bottom" || sourcePosition === "top") &&
    (targetPosition === "top" || targetPosition === "bottom");

  const dx = targetX - sourceX;
  const dy = targetY - sourceY;

  let customCenterX: number | undefined;
  let customCenterY: number | undefined;

  if (isHorizontal && Math.abs(dx) > 40) {
    const channelSpread =
      inSiblings.length > 1
        ? (inIndex - (inSiblings.length - 1) / 2) * 20
        : outSiblings.length > 1
          ? (outIndex - (outSiblings.length - 1) / 2) * 20
          : 0;
    const midX = (sourceX + targetX) / 2 + channelSpread;
    const minBound = Math.min(sourceX, targetX) + 28;
    const maxBound = Math.max(sourceX, targetX) - 28;
    customCenterX = Math.max(minBound, Math.min(maxBound, midX));
  } else if (isVertical && Math.abs(dy) > 40) {
    const channelSpread =
      inSiblings.length > 1
        ? (inIndex - (inSiblings.length - 1) / 2) * 20
        : outSiblings.length > 1
          ? (outIndex - (outSiblings.length - 1) / 2) * 20
          : 0;
    const midY = (sourceY + targetY) / 2 + channelSpread;
    const minBound = Math.min(sourceY, targetY) + 28;
    const maxBound = Math.max(sourceY, targetY) - 28;
    customCenterY = Math.max(minBound, Math.min(maxBound, midY));
  }

  const [edgePath, defaultLabelX, defaultLabelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
    centerX: customCenterX,
    centerY: customCenterY,
  });

  // Compute absolute bounding boxes of all non-group node cards so a label pill
  // never lands on top of a node card.
  const parentById = new Map(allNodes.map((n) => [n.id, n]));
  const nodeBoxes = allNodes
    .filter((n) => n.type !== "group" && n.id !== source && n.id !== target)
    .map((n) => {
      let nx = n.position.x;
      let ny = n.position.y;
      if (n.parentId) {
        const p = parentById.get(n.parentId);
        if (p) {
          nx += p.position.x;
          ny += p.position.y;
        }
      }
      const nw = n.measured?.width ?? 260;
      const nh = n.measured?.height ?? 140;
      return { x1: nx - 12, y1: ny - 12, x2: nx + nw + 12, y2: ny + nh + 12 };
    });

  const hitsAnyNode = (lx: number, ly: number): boolean => {
    const hw = 64;
    const hh = 14;
    return nodeBoxes.some(
      (b) => lx + hw > b.x1 && lx - hw < b.x2 && ly + hh > b.y1 && ly - hh < b.y2,
    );
  };

  // Build ordered candidate positions strictly on this edge's 3-segment smoothstep path
  const candidates: Array<{ x: number; y: number }> = [];

  if (isHorizontal && Math.abs(dx) > 70) {
    const cx = customCenterX ?? (sourceX + targetX) / 2;
    const srcRailX = sourceX + (cx - sourceX) * 0.52;
    const tgtRailX = cx + (targetX - cx) * 0.48;
    const vSpan = Math.abs(dy);

    if (vSpan > 28) {
      // Stagger fraction along the vertical segment so neither fan-in nor fan-out collide
      const frac =
        inSiblings.length > 1
          ? 0.28 + ((inIndex % 3) * 0.22)
          : outSiblings.length > 1
            ? 0.72 - ((outIndex % 3) * 0.22)
            : 0.5;
      const vertPoint = { x: cx, y: sourceY + dy * frac };

      if (inSiblings.length > 1 && outSiblings.length === 1) {
        // Fan-in from unique sources: source departure rail has a unique Y
        candidates.push({ x: srcRailX, y: sourceY }, vertPoint, { x: tgtRailX, y: targetY });
      } else if (outSiblings.length > 1 && inSiblings.length === 1) {
        // Fan-out to unique targets: target approach rail has a unique Y
        candidates.push({ x: tgtRailX, y: targetY }, vertPoint, { x: srcRailX, y: sourceY });
      } else {
        // Many-to-many or 1-to-1: vertical rail point depends on both sourceY and targetY
        candidates.push(vertPoint, { x: srcRailX, y: sourceY }, { x: tgtRailX, y: targetY });
      }
    } else {
      const t =
        inSiblings.length > 1
          ? 0.35 + ((inIndex % 3) * 0.16)
          : outSiblings.length > 1
            ? 0.65 - ((outIndex % 3) * 0.16)
            : 0.5;
      candidates.push(
        { x: sourceX + dx * t, y: (sourceY + targetY) / 2 },
        { x: srcRailX, y: sourceY },
        { x: tgtRailX, y: targetY },
      );
    }
  } else if (isVertical && Math.abs(dy) > 70) {
    const cy = customCenterY ?? (sourceY + targetY) / 2;
    const srcRailY = sourceY + (cy - sourceY) * 0.52;
    const tgtRailY = cy + (targetY - cy) * 0.48;
    const hSpan = Math.abs(dx);

    if (hSpan > 28) {
      const frac =
        inSiblings.length > 1
          ? 0.28 + ((inIndex % 3) * 0.22)
          : outSiblings.length > 1
            ? 0.72 - ((outIndex % 3) * 0.22)
            : 0.5;
      const horizPoint = { x: sourceX + dx * frac, y: cy };

      if (inSiblings.length > 1 && outSiblings.length === 1) {
        candidates.push({ x: sourceX, y: srcRailY }, horizPoint, { x: targetX, y: tgtRailY });
      } else if (outSiblings.length > 1 && inSiblings.length === 1) {
        candidates.push({ x: targetX, y: tgtRailY }, horizPoint, { x: sourceX, y: srcRailY });
      } else {
        candidates.push(horizPoint, { x: sourceX, y: srcRailY }, { x: targetX, y: tgtRailY });
      }
    } else {
      candidates.push({ x: (sourceX + targetX) / 2, y: sourceY + dy * 0.5 });
    }
  }

  candidates.push({ x: defaultLabelX, y: defaultLabelY });
  const chosen = candidates.find((c) => !hitsAnyNode(c.x, c.y)) ?? candidates[0];
  let labelX = chosen.x;
  let labelY = chosen.y;

  // If multiple edges connect the exact same pair of nodes, offset their labels cleanly
  if (samePair.length > 1) {
    const offset = (pairIndex - (samePair.length - 1) / 2) * 28;
    if (isHorizontal) labelY += offset;
    else labelX += offset;
  }

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
                  ? "z-40 max-w-[224px] nordic-panel rounded-xl px-2.5 py-1 text-caption font-medium text-foreground"
                  : "z-10 max-w-[144px] bg-card/95 backdrop-blur-xs border border-border rounded-full px-2.5 py-0.5 text-caption font-medium text-foreground/80 shadow-panel",
              !hasLabel && !isEditing && "border-dashed opacity-90",
            )}
          >
            {isEditing ? (
              <textarea
                ref={textareaRef}
                autoFocus
                rows={1}
                placeholder="Describe connection…"
                className="nodrag block w-full resize-none overflow-hidden bg-transparent text-caption leading-snug text-foreground placeholder:text-muted-foreground/70 p-0 outline-none border-none focus:ring-0 shadow-none text-center"
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
              <span className="block text-center text-caption text-muted-foreground whitespace-nowrap">
                + Add label
              </span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </g>
  );
}
