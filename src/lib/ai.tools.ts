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
    .describe(
      "Layout direction: 'LR' (left-to-right, preferred for data pipelines and system architectures) or 'TB' (top-to-bottom, preferred for layered or C4 hierarchies)",
    ),
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
// Builders & Layout Helpers
// ---------------------------------------------------------------------------

/** Conservative rendered card dimensions (cards are 224 to 268px wide). */
const DEFAULT_NODE_WIDTH = 268;
const DEFAULT_NODE_HEIGHT = 148;

const GROUP_PAD_X = 32;
const GROUP_PAD_TOP = 56;
const GROUP_PAD_BOTTOM = 32;
const GROUP_INNER_GAP_X = 160;
const GROUP_INNER_GAP_Y = 52;

type LayoutDirection = "TB" | "LR";

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

/**
 * Architectural stage (0 = far-left client entry, 8 = far-right observability)
 * used so diagrams always read clearly from Start (left) to End (right).
 */
function tierOf(node: DiagramNode): number {
  const st = String(node.data.subtype ?? "").toLowerCase();
  const cat = String(node.data.category ?? "").toLowerCase();
  const label = String(node.data.label ?? "").toLowerCase();
  const text = `${st} ${label}`;
  const has = (...keys: Array<string>) => keys.some((k) => text.includes(k));

  if (
    cat === "observability" ||
    has("monitor", "observab", "cloudwatch", "datadog", "prometheus", "grafana", "logging", "tracing", "telemetry")
  ) {
    return 8;
  }
  if (st === "c4-person" || st === "fe-user" || st === "fe-admin" || has("shopper", "customer", "client", "browser", "producer", "user")) {
    return 0;
  }
  if (has("cdn", "cloudfront", "waf", "route53", "route 53", "dns", "shield")) {
    return 1;
  }
  if (cat === "frontend") {
    return 1;
  }
  if (has("worker", "consumer", "processor", "cron", "scheduler", "etl", "batch")) {
    return 5;
  }
  if (
    has("queue", "sqs", "sns", "kafka", "kinesis", "rabbit", "event-bus", "event bus", "eventbridge", "broker", "msk", "pubsub", "pub/sub", "topic")
  ) {
    return 4;
  }
  if (
    has("gateway", "load-balancer", "load balancer", "proxy", "ingress", "bff", "graphql", "auth") ||
    /(^|-)(alb|nlb|elb)($|-)/.test(st)
  ) {
    return 2;
  }
  if (
    cat === "database" ||
    st.startsWith("db-") ||
    has("cache", "redis", "memcached", "s3", "bucket", "storage", "data lake", "warehouse", "elasticsearch", "opensearch", "search index", "postgres", "mysql", "dynamo", "mongo", "aurora", "rds", "snowflake", "database")
  ) {
    return 6;
  }
  if (node.data.isExternal || st === "c4-external-system" || has("stripe", "provider", "third-party", "third party", "external", "twilio", "sendgrid", "paypal")) {
    return 7;
  }
  return 3;
}

/**
 * Computes sub-columns for nodes inside a single group.
 * Peer nodes without internal edges stay in sub-column 0 (a clean single-column
 * vertical stack so no node ever blocks horizontal edges to its sibling).
 * Only genuine forward edges inside the group advance a child to sub-column 1+.
 */
function computeGroupSubColumns(
  members: Array<DiagramNode>,
  edges: Array<DiagramEdge>,
): Map<string, number> {
  const memberById = new Map(members.map((m) => [m.id, m]));
  const subCol = new Map<string, number>();
  for (const m of members) subCol.set(m.id, 0);

  const internalEdges = edges.filter(
    (e) =>
      memberById.has(e.source) &&
      memberById.has(e.target) &&
      e.source !== e.target,
  );

  // Relax forward internal edges up to max depth 2
  for (let pass = 0; pass < members.length; pass++) {
    let changed = false;
    for (const e of internalEdges) {
      const src = memberById.get(e.source)!;
      const tgt = memberById.get(e.target)!;
      const ts = tierOf(src);
      const tt = tierOf(tgt);
      if (ts <= tt) {
        const nextCol = Math.min(2, (subCol.get(src.id) ?? 0) + 1);
        if (nextCol > (subCol.get(tgt.id) ?? 0)) {
          subCol.set(tgt.id, nextCol);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }

  return subCol;
}

/**
 * Deterministic hierarchical layout for AI diagrams:
 * 1. Arranges each group's children into vertical sub-columns (1 column for parallel
 *    peers so no node sits in front of a sibling; 2 columns only when one member
 *    calls another inside the same group) and computes exact group dimensions.
 * 2. Runs Dagre on top-level entities (groups + ungrouped nodes) with tier-oriented
 *    edges so the diagram reads strictly Left -> Right from Start (clients) to End (data).
 * 3. Reorders children vertically inside each group by the average Y of their external
 *    connected neighbors to minimize edge crossings.
 */
function layoutArchitecture(
  nodes: Array<DiagramNode>,
  edges: Array<DiagramEdge>,
  direction: LayoutDirection,
): Array<DiagramNode> {
  const groupNodes = nodes.filter((n) => n.type === "group");
  const groupIds = new Set(groupNodes.map((g) => g.id));
  const leaves = nodes.filter((n) => n.type !== "group");
  if (leaves.length === 0) return nodes;

  const childrenByGroup = new Map<string, Array<DiagramNode>>();
  for (const leaf of leaves) {
    if (leaf.parentId && groupIds.has(leaf.parentId)) {
      const list = childrenByGroup.get(leaf.parentId) ?? [];
      list.push(leaf);
      childrenByGroup.set(leaf.parentId, list);
    }
  }

  const activeGroups = groupNodes.filter(
    (g) => (childrenByGroup.get(g.id)?.length ?? 0) > 0,
  );
  const activeGroupIds = new Set(activeGroups.map((g) => g.id));

  // Precompute sub-columns and exact bounding box size for each active group
  const groupMeta = new Map<
    string,
    {
      width: number;
      height: number;
      tier: number;
      columns: Map<number, Array<DiagramNode>>;
    }
  >();

  for (const grp of activeGroups) {
    const members = childrenByGroup.get(grp.id) ?? [];
    const subCols = computeGroupSubColumns(members, edges);
    const columns = new Map<number, Array<DiagramNode>>();
    for (const m of members) {
      const c = subCols.get(m.id) ?? 0;
      const list = columns.get(c) ?? [];
      list.push(m);
      columns.set(c, list);
    }

    const colKeys = [...columns.keys()].sort((a, b) => a - b);
    const numCols = Math.max(1, colKeys.length);
    const maxRows = Math.max(
      1,
      ...colKeys.map((k) => columns.get(k)?.length ?? 1),
    );

    const width =
      GROUP_PAD_X * 2 +
      numCols * DEFAULT_NODE_WIDTH +
      (numCols - 1) * GROUP_INNER_GAP_X;
    const height =
      GROUP_PAD_TOP +
      GROUP_PAD_BOTTOM +
      maxRows * DEFAULT_NODE_HEIGHT +
      (maxRows - 1) * GROUP_INNER_GAP_Y;

    const avgTier =
      members.reduce((sum, m) => sum + tierOf(m), 0) / members.length;

    groupMeta.set(grp.id, { width, height, tier: avgTier, columns });
  }

  // Map every leaf ID to its top-level root ID (group ID or its own ID)
  const rootOf = new Map<string, string>();
  const rootTier = new Map<string, number>();

  for (const grp of activeGroups) {
    rootOf.set(grp.id, grp.id);
    rootTier.set(grp.id, groupMeta.get(grp.id)!.tier);
  }
  for (const leaf of leaves) {
    const rid =
      leaf.parentId && activeGroupIds.has(leaf.parentId)
        ? leaf.parentId
        : leaf.id;
    rootOf.set(leaf.id, rid);
    if (!rootTier.has(rid)) {
      rootTier.set(rid, tierOf(leaf));
    }
  }

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    ranker: "network-simplex",
    nodesep: 72,
    ranksep: direction === "LR" ? 220 : 170,
    edgesep: 36,
    marginx: 40,
    marginy: 40,
  });

  const rootNodes: Array<DiagramNode> = [
    ...activeGroups,
    ...leaves.filter((l) => !l.parentId || !activeGroupIds.has(l.parentId)),
  ];

  for (const r of rootNodes) {
    const gm = groupMeta.get(r.id);
    g.setNode(r.id, {
      width: gm ? gm.width : DEFAULT_NODE_WIDTH,
      height: gm ? gm.height : DEFAULT_NODE_HEIGHT,
    });
  }

  // Add real edges between distinct root entities, oriented from lower tier to higher tier
  for (const e of edges) {
    const ra = rootOf.get(e.source);
    const rb = rootOf.get(e.target);
    if (!ra || !rb || ra === rb) continue;
    const ta = rootTier.get(ra) ?? 3;
    const tb = rootTier.get(rb) ?? 3;
    const [from, to] = ta > tb ? [rb, ra] : [ra, rb];
    if (g.hasEdge(from, to) || g.hasEdge(to, from)) continue;
    g.setEdge(from, to, { weight: 2, minlen: 1 });
  }

  // Backbone chain by tier so even loosely coupled stages stay ordered Start -> End
  const sortedRootsByTier = [...rootNodes].sort(
    (a, b) => (rootTier.get(a.id) ?? 3) - (rootTier.get(b.id) ?? 3),
  );
  for (let i = 0; i < sortedRootsByTier.length - 1; i++) {
    const cur = sortedRootsByTier[i];
    const nxt = sortedRootsByTier[i + 1];
    const tc = rootTier.get(cur.id) ?? 3;
    const tn = rootTier.get(nxt.id) ?? 3;
    if (tn > tc && !g.hasEdge(cur.id, nxt.id) && !g.hasEdge(nxt.id, cur.id)) {
      g.setEdge(cur.id, nxt.id, { weight: 1, minlen: 1 });
    }
  }

  dagre.layout(g);

  const rootPos = new Map<string, { x: number; y: number; w: number; h: number }>();
  for (const r of rootNodes) {
    const pos = g.node(r.id) as { x: number; y: number } | undefined;
    const gm = groupMeta.get(r.id);
    const w = gm ? gm.width : DEFAULT_NODE_WIDTH;
    const h = gm ? gm.height : DEFAULT_NODE_HEIGHT;
    const x = pos ? Math.round((pos.x - w / 2) / 20) * 20 : 40;
    const y = pos ? Math.round((pos.y - h / 2) / 20) * 20 : 40;
    rootPos.set(r.id, { x, y, w, h });
  }

  // Approximate center Y of each root entity so children inside a group can align
  // with their connected external neighbors and avoid diagonal edge crossings.
  const externalNeighborY = (leafId: string, groupId: string): number => {
    const ys: Array<number> = [];
    for (const e of edges) {
      const otherId =
        e.source === leafId ? e.target : e.target === leafId ? e.source : null;
      if (!otherId) continue;
      const otherRoot = rootOf.get(otherId);
      if (!otherRoot || otherRoot === groupId) continue;
      const rp = rootPos.get(otherRoot);
      if (rp) ys.push(rp.y + rp.h / 2);
    }
    if (ys.length === 0) return Number.POSITIVE_INFINITY;
    return ys.reduce((a, b) => a + b, 0) / ys.length;
  };

  const outGroups: Array<DiagramNode> = activeGroups.map((grp) => {
    const rp = rootPos.get(grp.id)!;
    return {
      ...grp,
      position: { x: rp.x, y: rp.y },
      style: {
        ...(grp.style ?? {}),
        width: rp.w,
        height: rp.h,
      },
    };
  });

  const childRelativePos = new Map<string, { x: number; y: number }>();
  for (const grp of activeGroups) {
    const gm = groupMeta.get(grp.id)!;
    const colKeys = [...gm.columns.keys()].sort((a, b) => a - b);
    colKeys.forEach((colKey, colIdx) => {
      const colMembers = [...(gm.columns.get(colKey) ?? [])].sort((a, b) => {
        const ya = externalNeighborY(a.id, grp.id);
        const yb = externalNeighborY(b.id, grp.id);
        if (ya !== yb) return ya - yb;
        return tierOf(a) - tierOf(b);
      });
      colMembers.forEach((member, rowIdx) => {
        childRelativePos.set(member.id, {
          x: GROUP_PAD_X + colIdx * (DEFAULT_NODE_WIDTH + GROUP_INNER_GAP_X),
          y: GROUP_PAD_TOP + rowIdx * (DEFAULT_NODE_HEIGHT + GROUP_INNER_GAP_Y),
        });
      });
    });
  }

  const outLeaves: Array<DiagramNode> = leaves.map((leaf) => {
    if (leaf.parentId && activeGroupIds.has(leaf.parentId)) {
      const rel = childRelativePos.get(leaf.id) ?? {
        x: GROUP_PAD_X,
        y: GROUP_PAD_TOP,
      };
      return {
        ...leaf,
        position: rel,
      };
    }
    const rp = rootPos.get(leaf.id);
    const { parentId: _drop, extent: _extent, ...rest } = leaf;
    return {
      ...rest,
      position: rp ? { x: rp.x, y: rp.y } : leaf.position,
    };
  });

  return [...outGroups, ...outLeaves];
}

/**
 * Assigns facing `sourceHandle` and `targetHandle` IDs to edges based on
 * the relative absolute geometry of their source and target nodes so edges
 * never cut through node cards.
 */
function assignSmartEdgeHandles(
  nodes: Array<DiagramNode>,
  edges: Array<DiagramEdge>,
  direction: LayoutDirection,
): Array<DiagramEdge> {
  const byId = new Map<string, DiagramNode>();
  for (const n of nodes) byId.set(n.id, n);

  const centerOf = (node: DiagramNode): { cx: number; cy: number } => {
    let x = node.position.x;
    let y = node.position.y;
    if (node.parentId) {
      const parent = byId.get(node.parentId);
      if (parent) {
        x += parent.position.x;
        y += parent.position.y;
      }
    }
    return { cx: x + DEFAULT_NODE_WIDTH / 2, cy: y + DEFAULT_NODE_HEIGHT / 2 };
  };

  return edges.map((edge) => {
    const src = byId.get(edge.source);
    const tgt = byId.get(edge.target);
    if (!src || !tgt) return edge;

    const sc = centerOf(src);
    const tc = centerOf(tgt);
    const dx = tc.cx - sc.cx;
    const dy = tc.cy - sc.cy;

    // Only use top/bottom handles when two nodes are stacked in the same column
    const inSameColumn = Math.abs(dx) < DEFAULT_NODE_WIDTH * 0.45;
    const useHorizontal =
      direction === "LR" ? !inSameColumn : Math.abs(dx) > Math.abs(dy);

    let sourceHandle: string;
    let targetHandle: string;

    if (useHorizontal) {
      if (dx >= 0) {
        sourceHandle = "right-s";
        targetHandle = "left-t";
      } else {
        sourceHandle = "left-s";
        targetHandle = "right-t";
      }
    } else if (dy >= 0) {
      sourceHandle = "bottom-s";
      targetHandle = "top-t";
    } else {
      sourceHandle = "top-s";
      targetHandle = "bottom-t";
    }

    return { ...edge, sourceHandle, targetHandle };
  });
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
  let needsLayout = false;
  let layoutDir: LayoutDirection = mode === "c4" ? "TB" : "LR";
  let title: string | undefined;
  const actions: Array<string> = [];

  for (const op of operations) {
    switch (op.type) {
      case "replace_diagram": {
        const seen = new Set<string>();
        const uniqueInputs = op.input.nodes.filter((n) => {
          if (seen.has(n.id)) return false;
          seen.add(n.id);
          return true;
        });
        const validIds = new Set(uniqueInputs.map((n) => n.id));
        nodes = uniqueInputs.map((n) => buildCanvasNode(n, mode));
        edges = op.input.edges
          .filter((e) => validIds.has(e.source) && validIds.has(e.target) && e.source !== e.target)
          .map((e, idx) => buildCanvasEdge(e, idx));

        layoutDir = mode === "c4" ? (op.input.direction ?? "TB") : "LR";
        needsLayout = true;
        title = op.input.title;
        shouldFitView = true;
        actions.push(`Generated ${nodes.length} nodes & ${edges.length} connections`);
        break;
      }

      case "add_elements": {
        const existingIds = new Set(nodes.map((n) => n.id));
        const existingRoots = nodes.filter((n) => !n.parentId);
        const maxX = existingRoots.reduce(
          (acc, n) =>
            Math.max(
              acc,
              n.position.x +
                (typeof n.style?.width === "number" ? n.style.width : DEFAULT_NODE_WIDTH),
            ),
          0,
        );
        const minY =
          existingRoots.length > 0
            ? Math.min(...existingRoots.map((n) => n.position.y))
            : 80;
        const startX = existingRoots.length > 0 ? maxX + 160 : 80;

        const addedNodes: Array<DiagramNode> = [];
        op.input.nodes.forEach((n, idx) => {
          if (existingIds.has(n.id)) return;
          existingIds.add(n.id);
          addedNodes.push(
            buildCanvasNode(n, mode, {
              x: Math.round((startX + (idx % 2) * (DEFAULT_NODE_WIDTH + 80)) / 20) * 20,
              y: Math.round((minY + Math.floor(idx / 2) * (DEFAULT_NODE_HEIGHT + 60)) / 20) * 20,
            }),
          );
        });

        nodes = [...nodes, ...addedNodes];

        const allIds = new Set(nodes.map((n) => n.id));
        const addedEdges = op.input.edges
          .filter((e) => allIds.has(e.source) && allIds.has(e.target) && e.source !== e.target)
          .map((e, idx) => buildCanvasEdge(e, idx));
        edges = [...edges, ...addedEdges];

        if (op.input.relayout || addedEdges.length > 0) {
          needsLayout = true;
        }
        if (addedNodes.length > 0 || addedEdges.length > 0) {
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
        const members = nodes.filter(
          (n) => targetIds.has(n.id) && !n.parentId && n.type !== "group",
        );
        if (members.length < 2) break;

        const groupId = `group-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const groupNode: DiagramNode = {
          id: groupId,
          type: "group",
          position: { x: 0, y: 0 },
          selected: false,
          style: {
            width: DEFAULT_NODE_WIDTH + GROUP_PAD_X * 2,
            height: DEFAULT_NODE_HEIGHT + GROUP_PAD_TOP + GROUP_PAD_BOTTOM,
            backgroundColor: "oklch(0.5 0 0 / 0.02)",
            border: "1.5px dotted oklch(0.5 0 0 / 0.25)",
            borderRadius: 12,
          },
          data: {
            label: op.input.label,
            category: "flow",
          },
        };

        const memberIds = new Set(members.map((m) => m.id));
        nodes = [
          groupNode,
          ...nodes.map((n) =>
            memberIds.has(n.id) ? { ...n, parentId: groupId } : n,
          ),
        ];
        needsLayout = true;
        shouldFitView = true;
        actions.push(`Grouped "${op.input.label}"`);
        break;
      }
    }
  }

  // Drop group frames that ended up empty
  const parentIds = new Set(nodes.filter((n) => n.parentId).map((n) => n.parentId as string));
  nodes = nodes.filter((n) => n.type !== "group" || parentIds.has(n.id));

  if (needsLayout) {
    nodes = layoutArchitecture(nodes, edges, layoutDir);
  }
  edges = assignSmartEdgeHandles(nodes, edges, layoutDir);
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
