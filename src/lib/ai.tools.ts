/**
 * @fileoverview Shared Zod schemas and canvas mutation executor for AI diagram tool calls.
 * Translates structured LLM tool operations into validated, Dagre-laid-out ReactFlow state.
 */

import dagre from "@dagrejs/dagre";
import { MarkerType } from "@xyflow/react";
import { z } from "zod";
import { resolveNodeTemplate } from "@/lib/ai.registry";
import { canvasStore, setDiagramFromAI } from "@/store/canvas.store";
import type { C4Level, DiagramEdge, DiagramNode, NodeMeta } from "@/types/diagram";

// ---------------------------------------------------------------------------
// Shared Zod Schemas (used by server tools & client executor)
// ---------------------------------------------------------------------------

export const aiNodeInputSchema = z.object({
  id: z.string().min(1).describe("Unique node ID, e.g. 'api-gw', 'user-svc', 'pg-main'"),
  subtype: z
    .string()
    .min(1)
    .describe("Component subtype from registry (e.g. 'ms-api-gateway', 'db-postgres', 'aws-lambda', 'c4-container')"),
  label: z.string().min(1).describe("Short display title (1-4 words)"),
  technology: z
    .string()
    .optional()
    .describe("Concise tech stack or subtitle (e.g. 'Go · gRPC', 'PostgreSQL 16', 'React · Vite')"),
  description: z
    .string()
    .optional()
    .describe("One-sentence engineering purpose"),
  status: z
    .enum(["existing", "planned", "deprecated"])
    .optional()
    .describe("Optional lifecycle status"),
  c4Level: z
    .enum(["context", "container", "component", "code"])
    .optional()
    .describe("For C4 mode: hierarchical level of this element"),
  isExternal: z
    .boolean()
    .optional()
    .describe("True if this represents a third-party or external system"),
});

export const aiEdgeInputSchema = z.object({
  source: z.string().min(1).describe("Source node ID"),
  target: z.string().min(1).describe("Target node ID"),
  label: z
    .string()
    .optional()
    .describe("Concise protocol or action label (e.g. 'HTTPS / REST', 'gRPC', 'Publishes events', 'Reads / Writes')"),
});

export const lookupComponentsInputSchema = z.object({
  query: z
    .string()
    .describe("Keywords or cloud provider name (e.g. 'aws queue', 'gcp database', 'kafka', 'oauth', 'ai llm')"),
  category: z
    .enum([
      "microservice",
      "cloud",
      "database",
      "frontend",
      "networking",
      "security",
      "observability",
      "ai",
      "devops",
      "flow",
      "shape",
      "c4",
    ])
    .optional()
    .describe("Optional category filter"),
});

export const replaceDiagramInputSchema = z.object({
  title: z.string().optional().describe("Short descriptive title for the generated architecture"),
  direction: z
    .enum(["TB", "LR"])
    .optional()
    .default("TB")
    .describe("Layout direction: 'TB' (top-to-bottom, default) or 'LR' (left-to-right)"),
  nodes: z.array(aiNodeInputSchema).min(1).describe("All nodes in the new diagram"),
  edges: z.array(aiEdgeInputSchema).describe("All connections between nodes"),
});

export const addElementsInputSchema = z.object({
  nodes: z.array(aiNodeInputSchema).optional().default([]).describe("New nodes to add"),
  edges: z
    .array(aiEdgeInputSchema)
    .optional()
    .default([])
    .describe("New connections (can reference both existing canvas node IDs and newly added node IDs)"),
  relayout: z
    .boolean()
    .optional()
    .default(false)
    .describe("Set true to re-run Dagre auto-layout across the whole canvas after adding"),
});

export const updateElementsInputSchema = z.object({
  nodes: z
    .array(
      z.object({
        id: z.string().min(1).describe("Existing node ID to update"),
        label: z.string().optional(),
        subtype: z.string().optional(),
        technology: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["existing", "planned", "deprecated"]).optional(),
        notes: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
  edges: z
    .array(
      z.object({
        id: z.string().min(1).describe("Existing edge ID to update"),
        label: z.string(),
      }),
    )
    .optional()
    .default([]),
});

export const removeElementsInputSchema = z.object({
  nodeIds: z.array(z.string()).optional().default([]).describe("Existing node IDs to delete"),
  edgeIds: z.array(z.string()).optional().default([]).describe("Existing edge IDs to delete"),
});

export const groupNodesInputSchema = z.object({
  label: z.string().min(1).describe("Group boundary label (e.g. 'Core Services', 'AWS VPC', 'Data Tier')"),
  nodeIds: z.array(z.string()).min(2).describe("IDs of nodes to wrap inside this group"),
});

// ---------------------------------------------------------------------------
// Operation Union & Summary Types
// ---------------------------------------------------------------------------

export type AICanvasOperation =
  | { type: "replace_diagram"; input: z.infer<typeof replaceDiagramInputSchema> }
  | { type: "add_elements"; input: z.infer<typeof addElementsInputSchema> }
  | { type: "update_elements"; input: z.infer<typeof updateElementsInputSchema> }
  | { type: "remove_elements"; input: z.infer<typeof removeElementsInputSchema> }
  | { type: "group_nodes"; input: z.infer<typeof groupNodesInputSchema> };

export interface ApplyOperationsResult {
  applied: boolean;
  shouldFitView: boolean;
  title?: string;
  nodeCount: number;
  edgeCount: number;
  summary: string;
}

// ---------------------------------------------------------------------------
// Builders & Dagre Layout Helper
// ---------------------------------------------------------------------------

const DEFAULT_NODE_WIDTH = 248;
const DEFAULT_NODE_HEIGHT = 96;

function buildCanvasNode(
  input: z.infer<typeof aiNodeInputSchema>,
  mode: "architecture" | "c4",
  position = { x: 0, y: 0 },
): DiagramNode {
  const tpl = resolveNodeTemplate(input.subtype, input.label, mode);
  const meta: NodeMeta = {
    label: input.label,
    category: tpl.category,
    subtype: tpl.subtype,
    icon: tpl.icon,
    description: input.description ?? tpl.description,
    technology: input.technology ?? tpl.technology,
    status: input.status,
    isExternal: input.isExternal,
    c4Level:
      input.c4Level ??
      (mode === "c4" ? ((canvasStore.state.c4Level || "container") as C4Level) : undefined),
  };

  return {
    id: input.id,
    type: "diagram",
    position,
    data: meta,
  };
}

function buildCanvasEdge(
  input: z.infer<typeof aiEdgeInputSchema>,
  index: number,
): DiagramEdge {
  const label = (input.label ?? "").trim();
  return {
    id: `ai-e-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    source: input.source,
    target: input.target,
    type: "smoothstep",
    animated: true,
    label: label || undefined,
    data: { label, animated: true },
    style: { stroke: "var(--edge-stroke, #a3a3a3)", strokeWidth: 1.5 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 14,
      height: 14,
      color: "var(--edge-stroke, #a3a3a3)",
    },
  };
}

function layoutWithDagre(
  nodes: Array<DiagramNode>,
  edges: Array<DiagramEdge>,
  direction: "TB" | "LR" = "TB",
): Array<DiagramNode> {
  const rootNodes = nodes.filter((n) => !n.parentId);
  if (rootNodes.length === 0) return nodes;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: direction === "TB" ? 80 : 60,
    ranksep: direction === "TB" ? 110 : 120,
    marginx: 40,
    marginy: 40,
  });

  const rootIds = new Set(rootNodes.map((n) => n.id));
  rootNodes.forEach((n) => {
    const w = n.measured?.width ?? (n.type === "group" ? 420 : DEFAULT_NODE_WIDTH);
    const h = n.measured?.height ?? (n.type === "group" ? 260 : DEFAULT_NODE_HEIGHT);
    g.setNode(n.id, { width: w, height: h });
  });

  edges.forEach((e) => {
    if (rootIds.has(e.source) && rootIds.has(e.target) && e.source !== e.target) {
      g.setEdge(e.source, e.target);
    }
  });

  dagre.layout(g);

  const positioned = new Map<string, DiagramNode>();
  rootNodes.forEach((n) => {
    const pos = g.node(n.id);
    if (!pos) return;
    const w = n.measured?.width ?? (n.type === "group" ? 420 : DEFAULT_NODE_WIDTH);
    const h = n.measured?.height ?? (n.type === "group" ? 260 : DEFAULT_NODE_HEIGHT);
    positioned.set(n.id, {
      ...n,
      position: {
        x: Math.round((pos.x - w / 2) / 20) * 20,
        y: Math.round((pos.y - h / 2) / 20) * 20,
      },
    });
  });

  return nodes.map((n) => positioned.get(n.id) ?? n);
}

// ---------------------------------------------------------------------------
// Single-Commit Canvas Executor
// ---------------------------------------------------------------------------

/**
 * Executes a batch of AI canvas tool operations against the live canvas state
 * and commits the final result as ONE undoable snapshot in `canvasStore`.
 */
export function applyAIOperationsToCanvas(
  operations: Array<AICanvasOperation>,
  mode: "architecture" | "c4",
): ApplyOperationsResult {
  if (operations.length === 0) {
    return {
      applied: false,
      shouldFitView: false,
      nodeCount: canvasStore.state.nodes.length,
      edgeCount: canvasStore.state.edges.length,
      summary: "",
    };
  }

  let nodes: Array<DiagramNode> = canvasStore.state.nodes.map((n) => ({ ...n }));
  let edges: Array<DiagramEdge> = canvasStore.state.edges.map((e) => ({ ...e }));
  let shouldFitView = false;
  let title: string | undefined;
  const actions: Array<string> = [];

  for (const op of operations) {
    switch (op.type) {
      case "replace_diagram": {
        const validIds = new Set(op.input.nodes.map((n) => n.id));
        const rawNodes = op.input.nodes.map((n) => buildCanvasNode(n, mode));
        const rawEdges = op.input.edges
          .filter((e) => validIds.has(e.source) && validIds.has(e.target) && e.source !== e.target)
          .map((e, idx) => buildCanvasEdge(e, idx));

        nodes = layoutWithDagre(rawNodes, rawEdges, op.input.direction ?? "TB");
        edges = rawEdges;
        title = op.input.title;
        shouldFitView = true;
        actions.push(`Generated ${nodes.length} nodes & ${edges.length} connections`);
        break;
      }

      case "add_elements": {
        const existingIds = new Set(nodes.map((n) => n.id));
        const maxY = nodes.reduce((acc, n) => Math.max(acc, n.position.y), 0);
        const startY = nodes.length > 0 ? maxY + 180 : 80;

        const addedNodes: Array<DiagramNode> = [];
        op.input.nodes.forEach((n, idx) => {
          if (existingIds.has(n.id)) return;
          existingIds.add(n.id);
          // Place near connected existing neighbor if possible, else clean row below
          const neighborEdge = op.input.edges.find(
            (e) =>
              (e.source === n.id && nodes.some((ex) => ex.id === e.target)) ||
              (e.target === n.id && nodes.some((ex) => ex.id === e.source)),
          );
          const neighbor = neighborEdge
            ? nodes.find(
                (ex) =>
                  ex.id === (neighborEdge.source === n.id ? neighborEdge.target : neighborEdge.source),
              )
            : undefined;

          const pos = neighbor
            ? {
                x: Math.round((neighbor.position.x + 300 + (idx % 2) * 40) / 20) * 20,
                y: Math.round((neighbor.position.y + idx * 120) / 20) * 20,
              }
            : {
                x: 80 + idx * 280,
                y: startY,
              };

          addedNodes.push(buildCanvasNode(n, mode, pos));
        });

        nodes = [...nodes, ...addedNodes];

        const allIds = new Set(nodes.map((n) => n.id));
        const addedEdges = op.input.edges
          .filter((e) => allIds.has(e.source) && allIds.has(e.target) && e.source !== e.target)
          .map((e, idx) => buildCanvasEdge(e, idx));
        edges = [...edges, ...addedEdges];

        if (op.input.relayout) {
          nodes = layoutWithDagre(nodes, edges, "TB");
          shouldFitView = true;
        } else if (addedNodes.length > 0) {
          shouldFitView = true;
        }
        actions.push(
          `Added ${addedNodes.length} node${addedNodes.length === 1 ? "" : "s"} & ${addedEdges.length} connection${addedEdges.length === 1 ? "" : "s"}`,
        );
        break;
      }

      case "update_elements": {
        const nodePatchMap = new Map(op.input.nodes.map((u) => [u.id, u]));
        nodes = nodes.map((n) => {
          const patch = nodePatchMap.get(n.id);
          if (!patch) return n;
          const nextTpl = patch.subtype
            ? resolveNodeTemplate(patch.subtype, patch.label ?? n.data.label, mode)
            : null;
          return {
            ...n,
            data: {
              ...n.data,
              ...(nextTpl
                ? {
                    subtype: nextTpl.subtype,
                    category: nextTpl.category,
                    icon: nextTpl.icon,
                  }
                : {}),
              ...(patch.label !== undefined ? { label: patch.label } : {}),
              ...(patch.technology !== undefined ? { technology: patch.technology } : {}),
              ...(patch.description !== undefined ? { description: patch.description } : {}),
              ...(patch.status !== undefined ? { status: patch.status } : {}),
              ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
            },
          };
        });

        const edgePatchMap = new Map(op.input.edges.map((u) => [u.id, u]));
        edges = edges.map((e) => {
          const patch = edgePatchMap.get(e.id);
          if (!patch) return e;
          return {
            ...e,
            label: patch.label,
            data: { ...e.data, label: patch.label },
          };
        });
        actions.push("Updated elements");
        break;
      }

      case "remove_elements": {
        const dropNodes = new Set(op.input.nodeIds);
        const dropEdges = new Set(op.input.edgeIds);
        nodes = nodes.filter((n) => !dropNodes.has(n.id));
        edges = edges.filter(
          (e) => !dropEdges.has(e.id) && !dropNodes.has(e.source) && !dropNodes.has(e.target),
        );
        actions.push("Removed elements");
        break;
      }

      case "group_nodes": {
        const targetIds = new Set(op.input.nodeIds);
        const members = nodes.filter((n) => targetIds.has(n.id) && !n.parentId);
        if (members.length < 2) break;

        const padding = 36;
        const headerOffset = 44;
        const minX = Math.min(...members.map((m) => m.position.x));
        const minY = Math.min(...members.map((m) => m.position.y));
        const maxX = Math.max(
          ...members.map((m) => m.position.x + (m.measured?.width ?? DEFAULT_NODE_WIDTH)),
        );
        const maxY = Math.max(
          ...members.map((m) => m.position.y + (m.measured?.height ?? DEFAULT_NODE_HEIGHT)),
        );

        const groupId = `group-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const groupX = minX - padding;
        const groupY = minY - headerOffset;

        const groupNode: DiagramNode = {
          id: groupId,
          type: "group",
          position: { x: groupX, y: groupY },
          style: {
            width: maxX - minX + padding * 2,
            height: maxY - minY + headerOffset + padding,
          },
          data: {
            label: op.input.label,
            category: mode === "c4" ? "c4" : "cloud",
          },
        };

        nodes = [
          groupNode,
          ...nodes.map((n) =>
            targetIds.has(n.id) && !n.parentId
              ? {
                  ...n,
                  parentId: groupId,
                  extent: "parent" as const,
                  position: {
                    x: n.position.x - groupX,
                    y: n.position.y - groupY,
                  },
                }
              : n,
          ),
        ];
        actions.push(`Grouped "${op.input.label}"`);
        break;
      }
    }
  }

  setDiagramFromAI(nodes, edges);

  return {
    applied: true,
    shouldFitView,
    title,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    summary: actions.join(" · "),
  };
}
