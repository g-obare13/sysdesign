import { useState, useEffect, useRef } from "react";
import {
  BaseEdge,
  getBezierPath,
  EdgeLabelRenderer,
  type EdgeProps,
} from "@xyflow/react";
import { updateEdgeMeta } from "../../store/canvas.store";

/**
 * Custom edge component for the diagram.
 * Renders a bezier path with an editable label in the center.
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

  // Keep draft in sync with saved value when not editing
  useEffect(() => {
    if (!isEditing) {
      setLabelDraft((data?.label as string) || "");
    }
  }, [data?.label, isEditing]);

  // Auto-resize textarea height to fit content
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

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: "var(--primary)",
          strokeWidth: 1.5,
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
            maxWidth: "150px",
          }}
          className="nodrag nopan rounded-md px-2.5 py-1 border text-[8px]!"
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
              className="nodrag w-full resize-none overflow-hidden bg-transparent text-[8px] p-0 outline-none border-none focus:ring-0 shadow-none"
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
            <span className="block w-full text-center text-[8px]! break-words">
              {(data?.label as string) || (
                <span className="opacity-75 text-[10px]">+ label</span>
              )}
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
