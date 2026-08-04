import { describe, it, expect, beforeEach, vi } from "vitest";

// Supabase is only used for cloud persistence; unit tests run as a guest.
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
  projectStore,
  createProject,
  MAX_PROJECTS,
  updateProject,
} from "./project.store";

describe("project.store", () => {
  beforeEach(() => {
    localStorage.clear();
    projectStore.setState(() => ({
      projects: [],
      activeProjectId: null,
      user: null,
      session: null,
      loading: false,
      migrating: false,
    }));
  });

  it("creates a project with a URL-safe unique slug", () => {
    const p = createProject("My App");
    expect(p).not.toBeNull();
    expect(p?.slug).toBe("my-app");
    expect(p?.type).toBe("design");
    expect(projectStore.state.projects).toHaveLength(1);
    expect(projectStore.state.activeProjectId).toBe(p?.id);
  });

  it("appends a numeric suffix when the slug is already taken", () => {
    const p1 = createProject("My App");
    const p2 = createProject("My App");
    const p3 = createProject("My App");
    expect(p1?.slug).toBe("my-app");
    expect(p2?.slug).toBe("my-app-2");
    expect(p3?.slug).toBe("my-app-3");
  });

  it("falls back to 'project' for names that slugify to empty", () => {
    const p = createProject("!!!");
    expect(p?.slug).toBe("project");
  });

  it("returns null once the project limit is reached", () => {
    for (let i = 0; i < MAX_PROJECTS; i++) {
      expect(createProject(`Project ${i}`)).not.toBeNull();
    }
    expect(projectStore.state.projects).toHaveLength(MAX_PROJECTS);
    expect(createProject("Too Many")).toBeNull();
  });

  it("renames a project without changing its slug", () => {
    const p = createProject("Original");
    updateProject(p!.id, { name: "Renamed" });
    const updated = projectStore.state.projects.find((x) => x.id === p!.id);
    expect(updated?.name).toBe("Renamed");
    expect(updated?.slug).toBe("original");
  });
});
