/**
 * @fileoverview Dynamic component catalog store backed by Supabase `catalog_components`
 * with stale-while-revalidate localStorage caching and instant static `REGISTRY` fallback.
 */

import { Store } from "@tanstack/store";
import { useEffect, useState } from "react";
import { REGISTRY } from "@/data/registry";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { NodeCategory, NodeTemplate } from "@/types/diagram";

export interface CatalogRow {
  subtype: string;
  label: string;
  category: NodeCategory;
  provider?: string;
  icon: string;
  description?: string | null;
  default_technology?: string | null;
  tags?: Array<string> | null;
  is_active?: boolean;
  sort_order?: number;
}

interface RegistryState {
  items: Array<NodeTemplate>;
  source: "static" | "cache" | "supabase";
  loading: boolean;
  lastSyncedAt: number | null;
}

const CACHE_KEY = "sysdesign-catalog-cache-v1";
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function mergeWithStatic(remoteRows: Array<CatalogRow>): Array<NodeTemplate> {
  const bySubtype = new Map<string, NodeTemplate>();

  // 1. Seed with bundled static templates for instant offline coverage
  for (const item of REGISTRY) {
    bySubtype.set(item.subtype, item);
  }

  // 2. Overlay Supabase rows (overrides existing subtypes & appends newly added ones)
  for (const row of remoteRows) {
    if (row.is_active === false) {
      bySubtype.delete(row.subtype);
      continue;
    }
    bySubtype.set(row.subtype, {
      subtype: row.subtype,
      label: row.label,
      category: row.category,
      icon: row.icon || "IconBox",
      description: row.description ?? "",
      technology: row.default_technology ?? undefined,
    });
  }

  return Array.from(bySubtype.values());
}

function loadCachedState(): { items: Array<NodeTemplate>; syncedAt: number } | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      items?: Array<NodeTemplate>;
      syncedAt?: number;
    };
    if (!Array.isArray(parsed.items) || parsed.items.length === 0) return null;
    return {
      items: parsed.items,
      syncedAt: parsed.syncedAt ?? 0,
    };
  } catch {
    return null;
  }
}

function saveCache(items: Array<NodeTemplate>, syncedAt: number): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(CACHE_KEY, JSON.stringify({ items, syncedAt }));
  } catch {}
}

const cached = loadCachedState();

export const registryStore = new Store<RegistryState>({
  items: cached ? cached.items : REGISTRY,
  source: cached ? "cache" : "static",
  loading: false,
  lastSyncedAt: cached ? cached.syncedAt : null,
});

let inFlightSync: Promise<void> | null = null;

/**
 * Fetches active components from Supabase `catalog_components` and merges them
 * over the static fallback registry. Silently no-ops if Supabase or the table isn't ready.
 */
export async function refreshCatalogFromSupabase(force = false): Promise<void> {
  if (!isSupabaseConfigured || typeof window === "undefined") return;

  const last = registryStore.state.lastSyncedAt;
  if (!force && last && Date.now() - last < CACHE_TTL_MS) {
    return;
  }

  if (inFlightSync) return inFlightSync;

  inFlightSync = (async () => {
    registryStore.setState((s) => ({ ...s, loading: true }));
    try {
      const { data, error } = await supabase
        .from("catalog_components")
        .select(
          "subtype, label, category, provider, icon, description, default_technology, tags, is_active, sort_order",
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error || !data || data.length === 0) {
        registryStore.setState((s) => ({ ...s, loading: false }));
        return;
      }

      const merged = mergeWithStatic(data as Array<CatalogRow>);
      const now = Date.now();
      saveCache(merged, now);

      registryStore.setState(() => ({
        items: merged,
        source: "supabase",
        loading: false,
        lastSyncedAt: now,
      }));
    } catch {
      registryStore.setState((s) => ({ ...s, loading: false }));
    } finally {
      inFlightSync = null;
    }
  })();

  return inFlightSync;
}

/**
 * Synchronous accessor for the current merged component catalog (used by AI tools & helpers).
 */
export function getRegistryItems(): Array<NodeTemplate> {
  return registryStore.state.items;
}

/**
 * React hook returning the live component catalog and triggering background SWR hydration.
 */
export function useRegistry() {
  const [state, setState] = useState<RegistryState>(registryStore.state);

  useEffect(() => {
    const sub = registryStore.subscribe(() => {
      setState(registryStore.state);
    });
    void refreshCatalogFromSupabase();
    return () => sub.unsubscribe();
  }, []);

  return {
    items: state.items,
    source: state.source,
    loading: state.loading,
    refresh: () => refreshCatalogFromSupabase(true),
  };
}
