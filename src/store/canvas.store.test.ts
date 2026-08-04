import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi
        .fn()
        .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockResolvedValue({ error: null }),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockReturnThis(),
    })),
  },
}));

import {
  canvasStore,
  addNode,
  undo,
  redo,
  clearCanvas,
  autoLayout,
  createProjectFromScratchpad,
} from "./canvas.store";
import { projectStore } from "./project.store";
import type { DiagramNode } from "../types/diagram";

function makeNode(id: string): DiagramNode {
  return {
    id,
    type: "diagram",
    position: { x: 0, y: 0 },
    data: {
      label: id,
      category: "microservice",
      subtype: "service",
      icon: "IconBox",
      description: "",
    },
  };
}

describe("canvas.store", () => {
  beforeEach(async () => {
    clearCanvas();
    // Let the module-level async init (load) settle so state starts clean.
    await Promise.resolve();
    await Promise.resolve();
  });

  it("adds nodes and advances history", () => {
    addNode(makeNode("a"));
    addNode(makeNode("b"));
    expect(canvasStore.state.nodes.map((n) => n.id)).toEqual(["a", "b"]);
    expect(canvasStore.state.historyIndex).toBe(2);
  });

  it("undo/redo revert and restore the canvas", () => {
    addNode(makeNode("a"));
    addNode(makeNode("b"));
    undo();
    expect(canvasStore.state.nodes.map((n) => n.id)).toEqual(["a"]);
    undo();
    expect(canvasStore.state.nodes).toHaveLength(0);
    redo();
    expect(canvasStore.state.nodes.map((n) => n.id)).toEqual(["a"]);
  });

  it("clearCanvas resets nodes, edges and history", () => {
    addNode(makeNode("a"));
    clearCanvas();
    expect(canvasStore.state.nodes).toHaveLength(0);
    expect(canvasStore.state.edges).toHaveLength(0);
    expect(canvasStore.state.historyIndex).toBe(0);
    expect(canvasStore.state.history).toHaveLength(1);
  });

  it("autoLayout moves nodes to distinct positions", () => {
    addNode(makeNode("a"));
    addNode(makeNode("b"));
    addNode(makeNode("c"));
    autoLayout();
    const positions = canvasStore.state.nodes.map((n) => `${n.position.x},${n.position.y}`);
    expect(new Set(positions).size).toBe(3);
  });

  it("promotes scratchpad content into a new project", () => {
    addNode(makeNode("scratch-a"));
    const p = createProjectFromScratchpad("Saved From Scratchpad");
    expect(p).not.toBeNull();
    expect(projectStore.state.activeProjectId).toBe(p?.id);
    // The scratchpad nodes carry over into the new project.
    expect(canvasStore.state.nodes.map((n) => n.id)).toEqual(["scratch-a"]);
  });
});
