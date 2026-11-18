/**
 * @fileoverview Compact canvas context serializer sent to the AI assistant
 * so it can see, critique, and incrementally edit the live diagram.
 */

import type { C4Level, DiagramEdge, DiagramNode } from "@/types/diagram";

export interface SerializedCanvasContext {
  mode: "architecture" | "c4";
  c4Level: C4Level;
  nodeCount: number;
  edgeCount: number;
  selectedNodeIds: Array<string>;
  nodes: Array<{
    id: string;
    label: string;
    subtype?: string;
    category: string;
    technology?: string;
    description?: string;
    status?: string;
    isGroup?: boolean;
    parentId?: string;
    selected?: boolean;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
  }>;
}

/**
 * Produces a token-efficient snapshot of the current canvas state.
 */
export function serializeCanvasContext(params: {
  nodes: Array<DiagramNode>;
  edges: Array<DiagramEdge>;
  diagramMode: "architecture" | "c4";
  c4Level: C4Level;
}): SerializedCanvasContext {
  const { nodes, edges, diagramMode, c4Level } = params;

  const selectedNodeIds = nodes.filter((n) => n.selected).map((n) => n.id);

  return {
    mode: diagramMode,
    c4Level,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    selectedNodeIds,
    nodes: nodes.map((n) => ({
      id: n.id,
      label: String(n.data?.label ?? ""),
      subtype: n.data?.subtype,
      category: String(n.data?.category ?? "microservice"),
      technology: n.data?.technology,
      description: n.data?.description,
      status: n.data?.status,
      isGroup: n.type === "group" || undefined,
      parentId: n.parentId,
      selected: n.selected || undefined,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: ((e.data?.label as string) || (e.label as string) || "").trim() || undefined,
    })),
  };
}
