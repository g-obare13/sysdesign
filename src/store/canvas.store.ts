import { Store } from '@tanstack/store'
import { useState, useEffect } from 'react'
import dagre from '@dagrejs/dagre'
import { applyNodeChanges, applyEdgeChanges, MarkerType } from '@xyflow/react'
import type { NodeChange, EdgeChange, Connection } from '@xyflow/react'
import type { DiagramNode, DiagramEdge, C4Level } from '../types/diagram'
import { projectStore, createProject, type ProjectType } from './project.store'
import { supabase } from '../lib/supabase'

let activeProjectId = projectStore.state.activeProjectId

/** When true, the next project switch skips reloading canvas data (used when
 * a scratchpad is being promoted into a freshly-created project). */
let skipNextLoad = false

function getStorageKey(mode: 'architecture' | 'c4' = (canvasStore?.state?.diagramMode ?? 'architecture')) {
  const suffix = mode === 'c4' ? '-c4' : ''
  return activeProjectId ? `sysdesign-diagram-${activeProjectId}${suffix}` : `sysdesign-v2${suffix}`
}

const MAX_HISTORY = 40

/**
 * Represents a snapshot of the canvas state for history tracking.
 */
export interface Snapshot {
  /** The collection of nodes in this snapshot */
  nodes: DiagramNode[]
  /** The collection of edges in this snapshot */
  edges: DiagramEdge[]
}

/**
 * The root state for the diagram canvas.
 */
export interface CanvasState {
  /** Current nodes on the canvas */
  nodes: DiagramNode[]
  /** Current edges on the canvas */
  edges: DiagramEdge[]
  /** Counter used to generate unique edge IDs */
  edgeCounter: number
  /** History of snapshots for undo/redo functionality */
  history: Snapshot[]
  /** Current index in the history stack */
  historyIndex: number
  /** Whether nodes should snap to the grid when moved */
  snapToGrid: boolean
  /** The ID of the node currently in editing mode */
  editingNodeId: string | null
  /** The current diagramming mode (affects palette and styles) */
  diagramMode: 'architecture' | 'c4'
  /** Current C4 level view */
  c4Level: C4Level
  /** Whether the canvas is currently being exported (hides UI) */
  isExporting: boolean
  /** Status of the last persistence attempt, shown in the toolbar save indicator */
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
}

const DEFAULT_CANVAS_STATE: CanvasState = {
  nodes: [],
  edges: [],
  edgeCounter: 0,
  history: [{ nodes: [], edges: [] }],
  historyIndex: 0,
  snapToGrid: false,
  editingNodeId: null,
  diagramMode: 'architecture',
  c4Level: 'context',
  isExporting: false,
  saveStatus: 'idle',
}

async function load(mode: 'architecture' | 'c4' = (canvasStore?.state?.diagramMode ?? 'architecture')): Promise<Partial<CanvasState>> {
  if (typeof window === 'undefined') return {}
  
  const user = projectStore.state.user
  if (user && activeProjectId && mode === 'architecture') {
    const { data, error } = await supabase
      .from('projects')
      .select('nodes, edges, edge_counter')
      .eq('id', activeProjectId)
      .single()
    
    if (error) {
      console.error('Supabase load error:', error.message)
      return {}
    }
    
    return {
      nodes: data.nodes as DiagramNode[],
      edges: data.edges as DiagramEdge[],
      edgeCounter: data.edge_counter as number,
    }
  }

  try {
    const raw = localStorage.getItem(getStorageKey(mode))
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

/** Where a queued save should be written. Captured at schedule time so a
 * project switch or auth change can't redirect the write to the wrong place. */
type SaveTarget =
  | { kind: 'cloud'; projectId: string }
  | { kind: 'local'; key: string }

interface PendingSave {
  state: CanvasState
  target: SaveTarget
}

/** Latest state queued for a debounced save. */
let pendingSave: PendingSave | null = null
let saveTimer: ReturnType<typeof setTimeout> | null = null

function setSaveStatus(status: CanvasState['saveStatus']) {
  canvasStore.setState((s) =>
    s.saveStatus === status ? s : { ...s, saveStatus: status },
  )
}

/**
 * Persists a queued save to Supabase or LocalStorage.
 * Returns true on success, false on failure.
 */
async function persist(job: PendingSave): Promise<boolean> {
  if (typeof window === 'undefined') return true
  const s = job.state

  if (job.target.kind === 'cloud') {
    const { error } = await supabase
      .from('projects')
      .update({
        nodes: s.nodes,
        edges: s.edges,
        edge_counter: s.edgeCounter,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.target.projectId)

    if (error) {
      console.error('Supabase save error:', error.message)
      return false
    }
    return true
  }

  try {
    localStorage.setItem(job.target.key, JSON.stringify({
      nodes: s.nodes, edges: s.edges, edgeCounter: s.edgeCounter,
      snapToGrid: s.snapToGrid,
    }))
    return true
  } catch {
    return false
  }
}

/**
 * Persists the canvas, debounced. Rapid mutations (e.g. dragging a node)
 * coalesce into a single write instead of firing one Supabase UPDATE per
 * frame. The save target is captured up-front so it stays correct even if
 * the active project changes before the debounce fires.
 */
function save(s: CanvasState) {
  const user = projectStore.state.user
  pendingSave = {
    state: s,
    target: user && activeProjectId && s.diagramMode === 'architecture'
      ? { kind: 'cloud', projectId: activeProjectId }
      : { kind: 'local', key: getStorageKey(s.diagramMode) },
  }
  // Defer the "saving" indicator until after the current store update settles.
  queueMicrotask(() => setSaveStatus('saving'))
  if (saveTimer) return
  saveTimer = setTimeout(() => {
    saveTimer = null
    const job = pendingSave
    pendingSave = null
    if (job) persist(job).then((ok) => setSaveStatus(ok ? 'saved' : 'error'))
  }, 400)
}

/**
 * Immediately flushes any pending debounced save. Call before switching
 * projects or leaving the page so the latest edits aren't lost.
 */
export function flushSave() {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  const job = pendingSave
  pendingSave = null
  if (job) persist(job).then((ok) => setSaveStatus(ok ? 'saved' : 'error'))
}

/**
 * The primary store for managing diagram canvas state.
 * Handles nodes, edges, history, and persistence to both Supabase and LocalStorage.
 */
export const canvasStore = new Store<CanvasState>(DEFAULT_CANVAS_STATE)

// Load initial data
if (typeof window !== 'undefined') {
  load().then(saved => {
    canvasStore.setState((s) => ({
      ...s,
      nodes: saved.nodes ?? [],
      edges: saved.edges ?? [],
      edgeCounter: saved.edgeCounter ?? 0,
      history: [{ nodes: saved.nodes ?? [], edges: saved.edges ?? [] }],
      snapToGrid: saved.snapToGrid ?? false,
      saveStatus: 'idle',
    }))
  })

  // Flush any pending debounced save before the page unloads.
  window.addEventListener('beforeunload', flushSave)
}

// Subscribe to project changes to reload relevant data
projectStore.subscribe(() => {
  const newActiveId = projectStore.state.activeProjectId
  if (newActiveId !== activeProjectId) {
    // Persist any unsaved edits for the previous project first.
    flushSave()
    activeProjectId = newActiveId
    if (skipNextLoad) {
      // A scratchpad was just promoted into a new project; the canvas has
      // already been hydrated, so skip the empty-project reload.
      skipNextLoad = false
      return
    }
    load().then(newSaved => {
      canvasStore.setState((s) => ({
        ...s,
        nodes: newSaved.nodes ?? [],
        edges: newSaved.edges ?? [],
        edgeCounter: newSaved.edgeCounter ?? 0,
        history: [{ nodes: newSaved.nodes ?? [], edges: newSaved.edges ?? [] }],
        historyIndex: 0,
        snapToGrid: newSaved.snapToGrid ?? false,
        saveStatus: 'idle',
      }))
    })
  }
})


/**
 * Toggles the grid snapping feature on the canvas and persists the change.
 */
export function toggleSnap() {
  canvasStore.setState((s) => {
    const next = { ...s, snapToGrid: !s.snapToGrid }
    save(next)
    return next
  })
}

function pushHistory(s: CanvasState): CanvasState {
  const snap: Snapshot = {
    nodes: JSON.parse(JSON.stringify(s.nodes)),
    edges: JSON.parse(JSON.stringify(s.edges)),
  }
  const trimmed = s.history.slice(0, s.historyIndex + 1)
  const next = [...trimmed, snap].slice(-MAX_HISTORY)
  return { ...s, history: next, historyIndex: next.length - 1 }
}

/**
 * Applies a set of node changes (position, selection, etc.) to the store.
 * @param changes - Array of changes to apply to nodes
 */
export function applyNodeChangesToStore(changes: NodeChange[]) {
  canvasStore.setState((s) => {
    const nodes = applyNodeChanges(changes, s.nodes) as DiagramNode[]
    const next = { ...s, nodes }
    save(next)
    return next
  })
}

/**
 * Applies a set of edge changes (selection, deletion, etc.) to the store.
 * @param changes - Array of changes to apply to edges
 */
export function applyEdgeChangesToStore(changes: EdgeChange[]) {
  canvasStore.setState((s) => {
    const edges = applyEdgeChanges(changes, s.edges)
    const next = { ...s, edges }
    save(next)
    return next
  })
}

/**
 * Creates a new connection between two nodes on the canvas.
 * @param connection - The connection details (source, target, handles)
 */
export function connectNodes(connection: Connection) {
  canvasStore.setState((s) => {
    const isC4 = s.diagramMode === 'c4'
    const edge: DiagramEdge = {
      id: `e-${s.edgeCounter + 1}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle ?? undefined,
      targetHandle: connection.targetHandle ?? undefined,
      type: 'smoothstep',
      label: isC4 ? 'Uses' : undefined,
      data: isC4 ? { label: 'Uses' } : {},
      style: { stroke: 'var(--primary)', strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary)' },
    }
    const next = pushHistory({ ...s, edges: [...s.edges, edge], edgeCounter: s.edgeCounter + 1 })
    save(next)
    return next
  })
}

/**
 * Updates an existing edge with a new connection path.
 * @param oldEdge - The edge being updated
 * @param newConnection - The new connection details
 */
export function updateEdgeConnection(oldEdge: DiagramEdge, newConnection: Connection) {
  canvasStore.setState((s) => {
    const edges = s.edges.map(e => {
      if (e.id === oldEdge.id) {
        return {
          ...e,
          source: newConnection.source,
          target: newConnection.target,
          sourceHandle: newConnection.sourceHandle ?? undefined,
          targetHandle: newConnection.targetHandle ?? undefined,
        }
      }
      return e
    })
    const next = pushHistory({ ...s, edges })
    save(next)
    return next
  })
}

/**
 * Adds a new node to the diagram.
 * @param node - The node object to add
 */
export function addNode(node: DiagramNode) {
  canvasStore.setState((s) => {
    const next = pushHistory({ ...s, nodes: [...s.nodes, node] })
    save(next)
    return next
  })
}

/**
 * Replaces the entire canvas with AI-generated nodes and edges.
 * Records to undo history so users can Ctrl+Z back to what they had.
 * @param nodes - Fully formed DiagramNode array from AI output parser
 * @param edges - Fully formed DiagramEdge array from AI output parser
 */
export function setDiagramFromAI(nodes: DiagramNode[], edges: DiagramEdge[]) {
  canvasStore.setState((s) => {
    const next = pushHistory({ ...s, nodes, edges })
    save(next)
    return next
  })
}

/**
 * Updates the text label displayed on a specific node.
 * @param id - The unique ID of the node
 * @param label - The new label text
 */
export function updateNodeLabel(id: string, label: string) {
  canvasStore.setState((s) => {
    const nodes = s.nodes.map((n) => n.id === id ? { ...n, data: { ...n.data, label } } : n)
    const next = pushHistory({ ...s, nodes })
    save(next)
    return next
  })
}

/**
 * Updates metadata (notes, owner, etc.) for a specific node.
 * @param id - The unique ID of the node
 * @param meta - Partial node data object containing updates
 */
export function updateNodeMeta(id: string, meta: Partial<DiagramNode['data']>) {
  canvasStore.setState((s) => {
    const nodes = s.nodes.map((n) => n.id === id ? { ...n, data: { ...n.data, ...meta } } : n)
    const next = pushHistory({ ...s, nodes })
    save(next)
    return next
  })
}

/**
 * Updates metadata for a specific edge.
 * @param id - The unique ID of the edge
 * @param meta - Metadata containing the new label and animation state
 */
export function updateEdgeMeta(id: string, meta: { label: string; animated?: boolean }) {
  canvasStore.setState((s) => {
    const edges = s.edges.map((e) => e.id === id ? { ...e, data: { ...e.data, ...meta }, label: meta.label } : e)
    const next = pushHistory({ ...s, edges })
    save(next)
    return next
  })
}

/**
 * Deletes all currently selected nodes and edges from the canvas.
 */
export function deleteSelected() {
  canvasStore.setState((s) => {
    const nodes = s.nodes.filter((n) => !n.selected)
    const edges = s.edges.filter((e) => !e.selected)
    if (nodes.length === s.nodes.length && edges.length === s.edges.length) return s
    const next = pushHistory({ ...s, nodes, edges })
    save(next)
    return next
  })
}

/**
 * Reverts the canvas to the previous state in the history stack.
 */
export function undo() {
  canvasStore.setState((s) => {
    if (s.historyIndex <= 0) return s
    const idx = s.historyIndex - 1
    const snap = s.history[idx]
    const next = { ...s, ...snap, historyIndex: idx }
    save(next)
    return next
  })
}

/**
 * Restores the canvas to the next state in the history stack.
 */
export function redo() {
  canvasStore.setState((s) => {
    if (s.historyIndex >= s.history.length - 1) return s
    const idx = s.historyIndex + 1
    const snap = s.history[idx]
    const next = { ...s, ...snap, historyIndex: idx }
    save(next)
    return next
  })
}

/**
 * Clears all nodes and edges from the canvas and resets history.
 */
export function clearCanvas() {
  canvasStore.setState((s) => {
    const next: CanvasState = {
      ...s,
      nodes: [], edges: [], edgeCounter: 0,
      history: [{ nodes: [], edges: [] }], historyIndex: 0,
    }
    save(next)
    return next
  })
}

/**
 * Promotes the current scratchpad canvas into a brand-new project, carrying
 * over any nodes/edges the user already drew on the landing editor.
 * @param name - The name of the new project
 * @param type - The project type (design or c4)
 * @param description - Optional description
 * @returns The newly created project, or null if the project limit is reached
 */
export function createProjectFromScratchpad(
  name: string,
  type: ProjectType = "design",
  description?: string,
) {
  const nodes = canvasStore.state.nodes
  const edges = canvasStore.state.edges
  const edgeCounter = canvasStore.state.edgeCounter

  // Tell the project-switch subscription not to wipe the canvas we just set.
  skipNextLoad = true
  const newProject = createProject(name, type, description)
  if (!newProject) {
    skipNextLoad = false
    return null
  }

  canvasStore.setState((s) => ({
    ...s,
    nodes,
    edges,
    edgeCounter,
    history: [{ nodes, edges }],
    historyIndex: 0,
    saveStatus: "idle",
  }))
  // Persist the promoted canvas into the new project (activeProjectId is set).
  save(canvasStore.state)
  // The scratchpad lives under the no-project key; clear it so it doesn't
  // linger or get double-migrated later.
  try {
    localStorage.removeItem("sysdesign-v2")
  } catch {}
  return newProject
}

/**
 * Auto-arranges root nodes on the canvas using a Dagre top-to-bottom layout.
 * Nodes inside groups keep their relative placement; only top-level nodes move.
 */
export function autoLayout() {
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 90 })

  const nodes = canvasStore.state.nodes.filter((n) => !n.parentId)
  if (nodes.length === 0) return

  const ids = new Set(nodes.map((n) => n.id))
  const edges = canvasStore.state.edges.filter(
    (e) => ids.has(e.source) && ids.has(e.target),
  )

  nodes.forEach((n) => {
    const w = n.measured?.width ?? 170
    const h = n.measured?.height ?? 100
    graph.setNode(n.id, { width: w, height: h })
  })
  edges.forEach((e) => graph.setEdge(e.source, e.target))

  dagre.layout(graph)

  // Dagre positions node CENTERS; convert to top-left canvas coordinates.
  const positioned = new Map(
    nodes.map((n) => {
      const pos = graph.node(n.id)
      const w = n.measured?.width ?? 170
      const h = n.measured?.height ?? 100
      return [
        n.id,
        {
          ...n,
          position: { x: pos.x - w / 2, y: pos.y - h / 2 },
        },
      ] as const
    }),
  )

  canvasStore.setState((s) => {
    const next = pushHistory({
      ...s,
      nodes: s.nodes.map((n) => positioned.get(n.id) ?? n),
    })
    save(next)
    return next
  })
}

/**
 * Clears the current canvas and loads a pre-defined architecture template.
 * @param template - The template object containing nodes and edges
 */
export function loadTemplate(template: { nodes: any[], edges: any[] }) {
  canvasStore.setState((s) => {
    const next: CanvasState = {
      ...s,
      nodes: template.nodes,
      edges: template.edges,
      edgeCounter: template.edges.length,
      history: [{ nodes: template.nodes, edges: template.edges }],
      historyIndex: 0,
    }
    save(next)
    return next
  })
}

/**
 * Groups selected nodes into a new container node.
 * @param explicitNodes - Optional array of nodes to group directly (bypasses store selection)
 */
export function groupSelected(explicitNodes?: any[]) {
  canvasStore.setState((s) => {
    // Identify which nodes to group: either passed explicitly or those selected in state
    const targetNodes = explicitNodes || s.nodes.filter((n) => n.selected && !n.parentId);
    if (targetNodes.length < 1) return s;

    // Calculate bounding box using explicit defaults for unmeasured nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    targetNodes.forEach((n) => {
      const w = n.measured?.width ?? 180;
      const h = n.measured?.height ?? 100;
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + w);
      maxY = Math.max(maxY, n.position.y + h);
    });

    const pad = 40;
    const groupId = `group-${Date.now()}`;
    const groupNode = {
      id: groupId,
      type: "group",
      position: { x: minX - pad, y: minY - pad },
      selected: false, // Explicitly false to prevent "group within group" visual box
      style: {
        width: maxX - minX + pad * 2,
        height: maxY - minY + pad * 2 + 20,
        backgroundColor: "oklch(0.5 0 0 / 0.02)",
        border: "1.5px dotted oklch(0.5 0 0 / 0.25)",
        borderRadius: 12,
      },
      data: { label: "New Group", category: "flow" },
    };

    // Construct the new nodes array with updated parents and relative positions
    const updatedNodes = s.nodes.map((n) => {
      const isTarget = targetNodes.some((tn) => tn.id === n.id);
      if (isTarget) {
        return {
          ...n,
          selected: false, // Deselect nodes once they are grouped
          parentId: groupId,
          position: {
            x: n.position.x - (minX - pad),
            y: n.position.y - (minY - pad),
          },
        };
      }
      return { ...n, selected: false };
    });

    const nextState = {
      ...s,
      nodes: [groupNode as any, ...updatedNodes],
    };

    const withHistory = pushHistory(nextState);
    save(withHistory);
    return withHistory;
  });
}

/**
 * Sets the current node being edited, or null to close all editors.
 * @param id - The unique ID of the node, or null
 */
export function setEditingNodeId(id: string | null) {
  canvasStore.setState((s) => ({ ...s, editingNodeId: id }));
}

/**
 * Sets the current diagramming mode and smoothly loads that mode's canvas data.
 * @param mode - 'architecture' | 'c4'
 */
export async function setDiagramMode(mode: 'architecture' | 'c4') {
  const current = canvasStore.state;
  if (current.diagramMode === mode) return;

  // Flush pending save for current mode before switching
  if (pendingSave) {
    await persist(pendingSave);
    pendingSave = null;
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
  }

  const loaded = await load(mode);
  canvasStore.setState((s) => ({
    ...s,
    diagramMode: mode,
    nodes: loaded.nodes ?? [],
    edges: loaded.edges ?? [],
    edgeCounter: loaded.edgeCounter ?? 0,
    history: [{ nodes: loaded.nodes ?? [], edges: loaded.edges ?? [] }],
    historyIndex: 0,
    saveStatus: 'idle',
  }));
}

/**
 * Sets the active C4 Model level (L1 Context, L2 Container, L3 Component, L4 Code).
 * @param level - C4Level
 */
export function setC4Level(level: C4Level) {
  canvasStore.setState((s) => ({ ...s, c4Level: level }));
}

/**
 * Sets the exporting state of the canvas.
 * @param exporting - Whether the canvas is being exported
 */
export function setExportingState(exporting: boolean) {
  canvasStore.setState((s) => ({ ...s, isExporting: exporting }))
}

/**
 * Custom hook to consume the canvas store in a React component.
 * Ensures hydration safety by returning default state initially and syncing on mount.
 * @param selector - Function to select specific data from the store
 * @returns The selected portion of the state
 */
export function useCanvasStore<T>(selector: (state: CanvasState) => T): T {
  // Always start with default state for hydration matching
  const [value, setValue] = useState<T>(() => selector(DEFAULT_CANVAS_STATE));

  useEffect(() => {
    // Sync with actual client state on mount
    setValue(selector(canvasStore.state));
    const sub = canvasStore.subscribe(() => {
      setValue(selector(canvasStore.state));
    });
    return () => sub.unsubscribe();
  }, [selector]);

  return value;
}
