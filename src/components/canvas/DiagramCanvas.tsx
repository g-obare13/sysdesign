import { useCallback, useRef, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  SelectionMode,
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
} from "../../store/canvas.store";
import { CATEGORY_STYLE, type NodeTemplate } from "../../types/diagram";
import type { DiagramNode, DiagramEdge } from "../../types/diagram";
import { cn } from "../../lib/utils";
import DiagramNodeComponent from "./DiagramNode";
import DiagramEdgeComponent from "./DiagramEdge";
import {
  IconMouse,
  IconClick,
  IconKeyboard,
  IconX,
  IconInfoCircle,
  IconCancel,
  IconTrash,
} from "@tabler/icons-react";
import { Button } from "../ui/button";

const nodeTypes: NodeTypes = { diagram: DiagramNodeComponent };
const edgeTypes: EdgeTypes = { smoothstep: DiagramEdgeComponent };
let nodeCounter = Date.now();

/**
 * The main diagramming canvas powered by React Flow.
 * Handles node/edge initialization, drag-and-drop from sidebar, keyboard shortcuts,
 * and integration with the canvas store for persistence and history.
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
  const [showHint, setShowHint] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hide-canvas-hint") !== "true";
    }
    return true;
  });

  const toggleHint = () => {
    const newState = !showHint;
    setShowHint(newState);
    if (newState === false) {
      localStorage.setItem("hide-canvas-hint", "true");
    } else {
      localStorage.removeItem("hide-canvas-hint");
    }
  };

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
          fitView({ nodes: selectedNodes, duration: 400 });
        else fitView({ duration: 400 });
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

      // Use screenToFlowPosition to correctly translate screen coordinates to the canvas
      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      // Adjust position to center the node under the cursor
      // Nodes typically have a fixed or estimated size, we'll offset by a reasonable default
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
        fitViewOptions={{ padding: 0.25 }}
        deleteKeyCode={null}
        proOptions={{ hideAttribution: true }}
        panOnDrag={[2, 3]}
        selectionMode={SelectionMode.Partial}
        panOnScroll={true}
        selectionOnDrag={true}
        selectionKeyCode={null}
        snapToGrid={snapToGrid}
        snapGrid={[20, 20]}
      >
        {!isExporting && <Background color="var(--border)" gap={20} size={1} />}
        {!isExporting && <Controls />}
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
              return isDark ? catStyle.dark.color : catStyle.color;
            }}
          />
        )}
      </ReactFlow>

      {/* Delete Confirmation Modal */}
      {showDelete && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-[--radius] shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200 flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-medium">Delete items?</h2>
              <p className="text-xs">
                {" "}
                Are you sure you want to delete {selectedCount} selected item
                {selectedCount !== 1 ? "s" : ""}? This action can be undone
                later with Ctrl+Z.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-2">
              <Button
                icon={IconCancel}
                iconSide="left"
                variant="outline"
                onClick={() => setShowDelete(false)}
              >
                Cancel
              </Button>

              <Button
                icon={IconTrash}
                iconSide="left"
                variant="destructive"
                onClick={() => {
                  deleteSelected();
                  setShowDelete(false);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-[--radius] shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowShortcuts(false)}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer rounded-none"
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
        </div>
      )}
      {/* Navigation Tips Toggle & Hint */}
      {!isExporting && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-end gap-3 pointer-events-none">
        {showHint && (
          <div className="animate-in slide-in-from-right-4 fade-in duration-300 pointer-events-auto">
            <div className="relative bg-card border border-border rounded-[--radius] p-5 shadow-2xl w-[260px] overflow-hidden">
              <button
                onClick={toggleHint}
                className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer rounded-none"
              >
                <IconX size={14} />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-primary/10 rounded-none">
                  <IconMouse size={18} className="text-primary" />
                </div>
                <h4 className="text-[13px] font-medium tracking-tight">
                  Navigation Tips
                </h4>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-muted/50 rounded-lg shrink-0">
                    <IconMouse size={14} className="text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold">Canvas Control</div>
                    <div className="text-[10px] text-muted-foreground leading-relaxed">
                      <span className="block font-medium text-foreground/80">
                        Right-click + Drag
                      </span>{" "}
                      Pan the design board
                      <span className="block font-medium text-foreground/80 mt-1">
                        Left-click + Drag
                      </span>{" "}
                      Draw box to Auto-Group
                      <span className="block font-medium text-foreground/80 mt-1">
                        Scroll Wheel
                      </span>{" "}
                      Zoom in and out
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-muted/50 rounded-lg shrink-0">
                    <IconKeyboard size={14} className="text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold">Shortcuts</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px] font-mono leading-none">
                          ^G
                        </kbd>
                        <span>Group</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px] font-mono leading-none">
                          F
                        </kbd>
                        <span>Fit View</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px] font-mono leading-none">
                          Del
                        </kbd>
                        <span>Delete</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px] font-mono leading-none">
                          ^Z
                        </kbd>
                        <span>Undo</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground col-span-2">
                        <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px] font-mono leading-none">
                          ^Y
                        </kbd>
                        <span>Redo (or ^⇧Z)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-muted/50 rounded-lg shrink-0">
                    <IconClick size={14} className="text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold">Editing</div>
                    <div className="text-[10px] text-muted-foreground leading-relaxed">
                      <span className="block font-medium text-foreground/80">
                        Double-click
                      </span>{" "}
                      Open editor for nodes or edges
                      <span className="block font-medium text-foreground/80 mt-1">
                        Drag Handles
                      </span>{" "}
                      Create new connections
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-border/40">
                <Button
                  onClick={toggleHint}
                  variant="outline"
                  className={"w-full"}
                >
                  Hide for now
                </Button>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={toggleHint}
          className={cn(
            "p-3 rounded-full shadow-lg border backdrop-blur-md transition-all duration-300 pointer-events-auto cursor-pointer",
            showHint
              ? "bg-primary text-white border-primary translate-x-12 opacity-0"
              : "bg-card text-muted-foreground hover:text-foreground border-border hover:border-primary/50 hover:shadow-primary/10",
          )}
          title="Show Navigation Tips"
        >
          <IconInfoCircle size={22} />
        </Button>
      </div>
      )}
    </div>
  );
}
