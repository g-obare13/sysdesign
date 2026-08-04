import { Store } from "@tanstack/store";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

/**
 * Represents a user-created diagram project.
 */
export type ProjectType = "design" | "c4";

export interface Project {
  /** Unique project identifier */
  id: string;
  /** URL-friendly name for routing */
  slug: string;
  /** Human-readable project name */
  name: string;
  /** Project type: design or c4 */
  type: ProjectType;
  /** Optional detailed description */
  description?: string;
  /** Unix timestamp of creation */
  createdAt: number;
  /** Unix timestamp of last update */
  updatedAt: number;
}

/**
 * Root state for managing projects and authentication.
 */
export interface ProjectState {
  /** List of all available projects */
  projects: Project[];
  /** ID of the currently active project */
  activeProjectId: string | null;
  /** Currently authenticated Supabase user */
  user: User | null;
  /** Current Supabase session */
  session: Session | null;
  /** Whether the store is initially loading data */
  loading: boolean;
  /** Whether a migration from local to cloud is in progress */
  migrating: boolean;
}

const STORAGE_KEY = "sysdesign-projects-v1";

/**
 * Maximum number of allowed projects for non-authenticated users.
 */
export const MAX_PROJECTS = 5;

const DEFAULT_PROJECT_STATE: ProjectState = {
  projects: [],
  activeProjectId: null,
  user: null,
  session: null,
  loading: true,
  migrating: false,
};

function load(): Partial<ProjectState> {
  try {
    if (typeof window === "undefined") return {};
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(s: ProjectState) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

const saved = load();

/**
 * The primary store for project management, authentication, and persistence.
 * Syncs with LocalStorage for guest users and Supabase for authenticated users.
 */
export const projectStore = new Store<ProjectState>({
  ...DEFAULT_PROJECT_STATE,
  ...saved,
});

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-"); // Replace multiple - with single -
}

/**
 * Creates a new project and persists it to the appropriate storage (Local or Supabase).
 * @param name - The name of the new project
 * @param type - The type of the project (design or c4)
 * @param description - Optional description for the project
 * @returns The newly created project object, or null if the project limit is reached
 */
export function createProject(name: string, type: ProjectType = "design", description?: string) {
  if (projectStore.state.projects.length >= MAX_PROJECTS) {
    return null;
  }

  // Ensure the URL slug is unique so two projects with the same name don't
  // collide on the same /slug route (e.g. "My App" -> my-app, my-app-2, ...).
  const existingSlugs = new Set(projectStore.state.projects.map((p) => p.slug));
  let slug = slugify(name) || "project";
  const baseSlug = slug;
  let counter = 2;
  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter++}`;
  }

  const newProject: Project = {
    id: uuidv4(),
    slug,
    name,
    type,
    description,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  projectStore.setState((s: ProjectState) => {
    const next = {
      ...s,
      projects: [newProject, ...s.projects],
      activeProjectId: newProject.id,
    };

    if (!s.user) {
      save(next);
    } else {
      // Supabase insert
      supabase
        .from("projects")
        .insert({
          id: newProject.id,
          user_id: s.user.id,
          name: newProject.name,
          slug: newProject.slug,
          type: newProject.type,
          description: newProject.description,
          created_at: new Date(newProject.createdAt).toISOString(),
          updated_at: new Date(newProject.updatedAt).toISOString(),
        })
        .then(({ error }) => {
          if (error) console.error("Supabase create error:", error.message);
        });
    }

    return next;
  });

  return newProject;
}

/**
 * Sets the currently active project for display on the canvas.
 * @param id - The unique ID of the project to activate, or null to clear selection
 */
export function setActiveProject(id: string | null) {
  projectStore.setState((s: ProjectState) => {
    const next = { ...s, activeProjectId: id };
    if (!s.user) save(next);
    return next;
  });
}

/**
 * Initiates the Google OAuth login process via Supabase.
 */
export async function login() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}`,
    },
  });
  if (error) console.error("Error logging in:", error.message);
}

/**
 * Signs out the current user and reverts the store to the locally saved projects.
 */
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error("Error logging out:", error.message);

  // Reset state to local projects
  const saved = load();
  projectStore.setState((s) => ({
    ...s,
    ...saved,
    user: null,
    session: null,
    loading: false,
  }));
}

// Migrate local projects to Supabase
async function migrateLocalToSupabase(user: User, localProjects: Project[]) {
  if (localProjects.length === 0) return;

  for (const p of localProjects) {
    // Load canvas data for this local project
    let canvasData = { nodes: [], edges: [], edgeCounter: 0 };
    try {
      // Check specific project storage first, then legacy fallback
      const raw =
        localStorage.getItem(`sysdesign-diagram-${p.id}`) ||
        localStorage.getItem("sysdesign-v2");
      if (raw) canvasData = JSON.parse(raw);
    } catch (e) {}

    const { error } = await supabase.from("projects").insert({
      id: p.id,
      user_id: user.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      nodes: canvasData.nodes,
      edges: canvasData.edges,
      edge_counter: canvasData.edgeCounter,
      created_at: new Date(p.createdAt).toISOString(),
      updated_at: new Date(Date.now()).toISOString(),
    });

    if (error) {
      if (error.code === "23505") {
        console.log(
          `Project ${p.name} already exists in cloud, skipping insert.`,
        );
      } else {
        console.error("Migration error for project:", p.name, error.message);
        // If error is project limit, we might want to stop migrating others
        if (error.message.includes("limit")) break;
      }
    }

    // Always clear the specific project diagram from local storage to avoid double-migration
    localStorage.removeItem(`sysdesign-diagram-${p.id}`);
  }

  // Clear the main local project list and active project index completely
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("active_project_id");
  // For legacy support
  localStorage.removeItem("sysdesign-v2");
}

// Sync projects from Supabase
async function syncFromSupabase() {
  projectStore.setState((s: ProjectState) => ({ ...s, loading: true }));
  const user = projectStore.state.user;
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, slug, name, type, description, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching Supabase projects:", error.message);
    // Always clear loading even on error — otherwise the spinner gets stuck
    projectStore.setState((s: ProjectState) => ({ ...s, loading: false, migrating: false }));
    return;
  }

  const projectList = (projects || []).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    type: (p.type as ProjectType) ?? "design",
    description: p.description,
    createdAt: new Date(p.created_at).getTime(),
    updatedAt: new Date(p.updated_at).getTime(),
  }));

  // Trigger migration if we have local projects
  const local = load();
  if (local.projects && local.projects.length > 0 && user) {
    projectStore.setState((s: ProjectState) => ({ ...s, migrating: true }));
    await migrateLocalToSupabase(user, local.projects);

    // Refresh the list after migration
    const { data: refreshed } = await supabase
      .from("projects")
      .select("id, slug, name, type, description, created_at, updated_at")
      .order("updated_at", { ascending: false });

    if (refreshed) {
      projectStore.setState((s: ProjectState) => ({
        ...s,
        projects: refreshed.map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          type: (p.type as ProjectType) ?? "design",
          description: p.description,
          createdAt: new Date(p.created_at).getTime(),
          updatedAt: new Date(p.updated_at).getTime(),
        })),
        loading: false,
        migrating: false,
      }));
      return;
    }
  }

  projectStore.setState((s: ProjectState) => ({
    ...s,
    projects: projectList,
    loading: false,
    migrating: false,
  }));
}

// Initial session check
if (typeof window !== "undefined") {
  // Safety timeout: if auth/sync hangs for > 5s, force-clear the loading state
  const loadingTimeout = setTimeout(() => {
    if (projectStore.state.loading) {
      console.warn("[SysDesign] Loading timed out — clearing loading state");
      const local = load();
      projectStore.setState((s: ProjectState) => ({
        ...s,
        ...local,
        loading: false,
        migrating: false,
      }));
    }
  }, 5000);

  supabase.auth.getSession().then(({ data: { session } }) => {
    projectStore.setState((s) => ({
      ...s,
      session,
      user: session?.user ?? null,
      loading: !session, // if no session, we're not loading anymore
    }));

    if (session) {
      syncFromSupabase().finally(() => clearTimeout(loadingTimeout));
    } else {
      clearTimeout(loadingTimeout);
      projectStore.setState((s: ProjectState) => ({ ...s, loading: false }));
    }
  }).catch(() => {
    clearTimeout(loadingTimeout);
    const local = load();
    projectStore.setState((s: ProjectState) => ({ ...s, ...local, loading: false }));
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    projectStore.setState((s: ProjectState) => ({
      ...s,
      session,
      user: session?.user ?? null,
      loading: !!session, // Stay in loading state if we're about to sync
      activeProjectId: null,
    }));
    if (session) {
      syncFromSupabase();
    } else {
      const local = load();
      projectStore.setState((s: ProjectState) => ({
        ...s,
        ...local,
        loading: false,
      }));
    }
  });
}

/**
 * Deletes a project from storage (Local or Supabase) and clears it from the store.
 * @param id - The unique ID of the project to delete
 */
export function deleteProject(id: string) {
  projectStore.setState((s) => {
    const next = {
      ...s,
      projects: s.projects.filter((p) => p.id !== id),
      activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
    };

    if (!s.user) {
      save(next);
    } else {
      // Supabase handle delete
      supabase
        .from("projects")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error("Supabase delete error:", error);
        });
    }

    return next;
  });
}

/**
 * Updates an existing project's details (name, slug, description).
 * @param id - The unique ID of the project to update
 * @param updates - Object containing the fields to update
 */
export function updateProject(
  id: string,
  updates: Partial<Omit<Project, "id" | "createdAt">>,
) {
  projectStore.setState((s: ProjectState) => {
    const projects = s.projects.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p,
    );
    const next = { ...s, projects };

    if (!s.user) {
      save(next);
    } else {
      const updated = projects.find((p) => p.id === id);
      if (updated) {
        supabase
          .from("projects")
          .update({
            name: updated.name,
            slug: updated.slug,
            description: updated.description,
            updated_at: new Date(updated.updatedAt).toISOString(),
          })
          .eq("id", id)
          .then(({ error }) => {
            if (error) console.error("Supabase update error:", error.message);
          });
      }
    }

    return next;
  });
}

/**
 * Custom hook to consume the project store in a React component.
 * Ensures hydration safety by returning default state initially and syncing on mount.
 * @param selector - Function to select specific data from the store
 * @returns The selected portion of the state
 */
export function useProjectStore<T>(selector: (state: ProjectState) => T): T {
  // Use server-safe initial state for hydration
  const [state, setState] = useState<T>(() => selector(DEFAULT_PROJECT_STATE));

  useEffect(() => {
    // Client-side initialization
    setState(selector(projectStore.state));
    const sub = projectStore.subscribe(() => {
      setState(selector(projectStore.state));
    });
    return () => sub.unsubscribe();
  }, [selector]);

  return state;
}
