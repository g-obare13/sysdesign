/**
 * @fileoverview Primary interactive ReactFlow diagram canvas.
 * Manages viewport panning, drag-and-drop node placement, hotkeys, connections, and selection modals.
 */

import { useCallback, useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";
import {
  ReactFlow,
  Background,
  MiniMap,
  SelectionMode,
  ConnectionLineType,
  MarkerType,
  useReactFlow,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  canvasStore,
  applyNodeChangesToStore,
  applyEdgeChangesToStore,
  connectNodes,
  addNode,
  deleteSelected,
  undo,
  redo,
  groupSelected,
  updateEdgeConnection,
  setEditingNodeId,
  useCanvasStore,
} from "@/store/canvas.store";
import { CATEGORY_STYLE, type NodeTemplate } from "@/types/diagram";
import type { DiagramNode, DiagramEdge } from "@/types/diagram";
import DiagramNodeComponent from "./DiagramNode";
import DiagramEdgeComponent from "./DiagramEdge";
import { IconX } from "@tabler/icons-react";
import ConfirmModal from "@/components/ui/ConfirmModal";

const nodeTypes: NodeTypes = { diagram: DiagramNodeComponent };
const edgeTypes: EdgeTypes = { smoothstep: DiagramEdgeComponent };
let nodeCounter = Date.now();

/**
 * The main diagramming canvas powered by React Flow.
 * Handles node/edge initialization, drag-and-drop from sidebar, keyboard shortcuts,
 * and integration with the canvas store for persistence and history.
 *
 * @returns ReactFlow Diagram Canvas component
 */
export default function DiagramCanvas() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const snapToGrid = useCanvasStore((s) => s.snapToGrid);
  const isExporting = useCanvasStore((s) => s.isExporting);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { fitView, getNodes, screenToFlowPosition } = useReactFlow();
  const [showDelete, setShowDelete] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const selectedCount =
    nodes.filter((n) => n.selected).length +
    edges.filter((e) => e.selected).length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (
        typeof tag === "string" &&
        (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT")
      )
        return;
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "g") {
        e.preventDefault();
        groupSelected();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const hasSelection =
          canvasStore.state.nodes.some((n) => n.selected) ||
          canvasStore.state.edges.some((e) => e.selected);
        if (hasSelection) {
          setShowDelete(true);
        }
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        const selectedNodes = canvasStore.state.nodes.filter((n) => n.selected);
        if (selectedNodes.length > 0)
          fitView({ nodes: selectedNodes, duration: 400, maxZoom: 1 });
        else fitView({ duration: 400, maxZoom: 1 });
      }
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        setShowShortcuts(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!showShortcuts) return;
    const onModalKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowShortcuts(false);
    };
    window.addEventListener("keydown", onModalKey);
    return () => window.removeEventListener("keydown", onModalKey);
  }, [showShortcuts]);

  useEffect(() => {
    if (!showDelete) return;
    const onModalKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        deleteSelected();
        setShowDelete(false);
      }
      if (e.key === "Escape") {
        setShowDelete(false);
      }
    };
    window.addEventListener("keydown", onModalKey);
    return () => window.removeEventListener("keydown", onModalKey);
  }, [showDelete]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => applyNodeChangesToStore(changes),
    [],
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => applyEdgeChangesToStore(changes),
    [],
  );
  const onConnect: OnConnect = useCallback((conn) => connectNodes(conn), []);

  const onReconnect = useCallback((oldEdge: any, newConnection: any) => {
    updateEdgeConnection(oldEdge as DiagramEdge, newConnection);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData("application/sysdesign");
      if (!raw) return;
      const template: NodeTemplate = JSON.parse(raw);

      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      position.x -= 75;
      position.y -= 40;

      nodeCounter++;
      const node: DiagramNode = {
        id: `node-${nodeCounter}`,
        type: "diagram",
        position,
        data: {
          label: template.label,
          category: template.category,
          subtype: template.subtype,
          icon: template.icon,
          description: template.description,
        },
      };
      addNode(node);
    },
    [screenToFlowPosition],
  );

  const onPaneClick = useCallback(() => {
    setEditingNodeId(null);
  }, []);

  const onSelectionEnd = useCallback(() => {
    const rawNodes = getNodes();
    const selectedNodes = rawNodes.filter((n) => n.selected);
    if (selectedNodes.length > 1) {
      groupSelected(selectedNodes);
    }
  }, [getNodes]);

  return (
    <div ref={wrapRef} style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        id="sys-diagram"
        nodes={nodes}
        edges={edges}
        colorMode={isDark ? "dark" : "light"}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={onReconnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onPaneClick={onPaneClick}
        onSelectionEnd={onSelectionEnd}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.2}
        maxZoom={2}
        deleteKeyCode={null}
        proOptions={{ hideAttribution: true }}
        panOnDrag={[2, 3]}
        selectionMode={SelectionMode.Partial}
        panOnScroll={true}
        selectionOnDrag={true}
        connectionLineStyle={{ stroke: "var(--primary)", strokeWidth: 2 }}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{
          style: { stroke: "var(--primary)", strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "var(--primary)" },
        }}
        snapToGrid={snapToGrid}
        snapGrid={[20, 20]}
      >
        {!isExporting && <Background color="var(--border)" gap={20} size={1} />}
        {!isExporting && (
          <MiniMap
            pannable
            zoomable
            nodeColor={(n) => {
              const cat = (n.data as { category?: string })?.category;
              const catStyle = cat
                ? CATEGORY_STYLE[cat as keyof typeof CATEGORY_STYLE]
                : null;
              if (!catStyle) return "#aaa";
              return (
                (isDark && catStyle.dark?.color) || catStyle.color || "#aaa"
              );
            }}
          />
        )}
      </ReactFlow>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={showDelete}
        title="Delete items?"
        description={`Are you sure you want to delete ${selectedCount} selected item${selectedCount !== 1 ? "s" : ""}? This action can be undone later with Ctrl+Z.`}
        confirmText="Delete"
        isDestructive
        onClose={() => setShowDelete(false)}
        onConfirm={() => {
          deleteSelected();
          setShowDelete(false);
        }}
      />
      {/* Keyboard Shortcuts Modal */}
      {showShortcuts &&
        createPortal(
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-background/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h6 className="text-sm font-medium">Keyboard Shortcuts</h6>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer rounded-full"
                  aria-label="Close shortcuts"
                >
                  <IconX size={14} />
                </button>
              </div>
              <div className="flex flex-col text-xs">
                {[
                  ["⌘/Ctrl + Z", "Undo"],
                  ["⌘/Ctrl + Y", "Redo"],
                  ["⌘/Ctrl + Shift + Z", "Redo"],
                  ["⌘/Ctrl + G", "Group selection"],
                  ["Delete / Backspace", "Delete selection"],
                  ["F", "Fit view"],
                  ["?", "Show this help"],
                ].map(([keys, desc]) => (
                  <div
                    key={`${keys}-${desc}`}
                    className="flex items-center justify-between gap-4 py-1.5 border-b border-border/40 last:border-0"
                  >
                    <kbd className="text-[10px] font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded-sm border border-border">
                      {keys}
                    </kbd>
                    <span className="text-[11px] text-muted-foreground">
                      {desc}
                    </span>
                  </div>
                ))}
                <p className="text-[10px] text-muted-foreground/70 pt-2">
                  Tip: drag components from the sidebar, double-click a node to
                  edit it.
                </p>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
