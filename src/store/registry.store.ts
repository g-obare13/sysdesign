/**
 * @fileoverview Dynamic component catalog store backed by Supabase `catalog_components`
 * with stale-while-revalidate localStorage caching and instant static `REGISTRY` fallback.
 */

import { Store } from "@tanstack/store";
import { useEffect, useState } from "react";
import { REGISTRY } from "@/data/registry";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { CATEGORY_STYLE } from "@/types/diagram";
import type { CategoryStyle, NodeCategory, NodeTemplate } from "@/types/diagram";

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

export interface CatalogCategoryRow {
  id: string;
  label: string;
  color: string;
  bg: string;
  border: string;
  text_color: string;
  pill: string;
  dark_color?: string | null;
  dark_bg?: string | null;
  dark_border?: string | null;
  dark_text_color?: string | null;
  dark_pill?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

interface RegistryState {
  items: Array<NodeTemplate>;
  categories: Record<string, CategoryStyle>;
  source: "static" | "cache" | "supabase";
  loading: boolean;
  lastSyncedAt: number | null;
}

const CACHE_KEY = "sysdesign-catalog-cache-v1";
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function mergeCategoryStyles(
  remoteRows: Array<CatalogCategoryRow>,
): Record<string, CategoryStyle> {
  const merged: Record<string, CategoryStyle> = { ...CATEGORY_STYLE };

  for (const row of remoteRows) {
    if (row.is_active === false) continue;
    const base = merged[row.id];
    merged[row.id] = {
      label: row.label || base?.label || row.id,
      color: row.color,
      bg: row.bg,
      border: row.border,
      text: row.text_color,
      pill: row.pill,
      dark: {
        color: row.dark_color ?? base?.dark?.color ?? row.color,
        bg: row.dark_bg ?? base?.dark?.bg ?? row.bg,
        border: row.dark_border ?? base?.dark?.border ?? row.border,
        text: row.dark_text_color ?? base?.dark?.text ?? row.text_color,
        pill: row.dark_pill ?? base?.dark?.pill ?? row.pill,
      },
    };
  }

  return merged;
}

function applyCategoryCssVars(categories: Record<string, CategoryStyle>): void {
  if (typeof document === "undefined") return;
  const lightRules: Array<string> = [];
  const darkRules: Array<string> = [];

  for (const [id, style] of Object.entries(categories)) {
    lightRules.push(
      `--cat-${id}-pill: ${style.pill};`,
      `--cat-${id}-bg: ${style.bg};`,
      `--cat-${id}-border: ${style.border};`,
      `--cat-${id}-color: ${style.color};`,
    );
    if (style.dark) {
      if (style.dark.pill) darkRules.push(`--cat-${id}-pill: ${style.dark.pill};`);
      if (style.dark.bg) darkRules.push(`--cat-${id}-bg: ${style.dark.bg};`);
      if (style.dark.border) darkRules.push(`--cat-${id}-border: ${style.dark.border};`);
      if (style.dark.color) darkRules.push(`--cat-${id}-color: ${style.dark.color};`);
    }
  }

  const styleId = "catalog-category-vars";
  let el = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = styleId;
    document.head.appendChild(el);
  }
  el.textContent = `:root { ${lightRules.join(" ")} }\n.dark { ${darkRules.join(" ")} }`;
}

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

function loadCachedState(): {
  items: Array<NodeTemplate>;
  categories?: Record<string, CategoryStyle>;
  syncedAt: number;
} | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      items?: Array<NodeTemplate>;
      categories?: Record<string, CategoryStyle>;
      syncedAt?: number;
    };
    if (!Array.isArray(parsed.items) || parsed.items.length === 0) return null;
    return {
      items: parsed.items,
      categories: parsed.categories,
      syncedAt: parsed.syncedAt ?? 0,
    };
  } catch {
    return null;
  }
}

function saveCache(
  items: Array<NodeTemplate>,
  categories: Record<string, CategoryStyle>,
  syncedAt: number,
): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ items, categories, syncedAt }),
    );
  } catch {}
}

const cached = loadCachedState();
const initialCategories = cached?.categories
  ? { ...CATEGORY_STYLE, ...cached.categories }
  : { ...CATEGORY_STYLE };

if (typeof window !== "undefined") {
  applyCategoryCssVars(initialCategories);
}

export const registryStore = new Store<RegistryState>({
  items: cached ? cached.items : REGISTRY,
  categories: initialCategories,
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
      const [compRes, catRes] = await Promise.allSettled([
        supabase
          .from("catalog_components")
          .select(
            "subtype, label, category, provider, icon, description, default_technology, tags, is_active, sort_order",
          )
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("catalog_categories")
          .select(
            "id, label, color, bg, border, text_color, pill, dark_color, dark_bg, dark_border, dark_text_color, dark_pill, is_active, sort_order",
          )
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
      ]);

      const compData =
        compRes.status === "fulfilled" && !compRes.value.error
          ? (compRes.value.data as Array<CatalogRow> | null)
          : null;
      const catData =
        catRes.status === "fulfilled" && !catRes.value.error
          ? (catRes.value.data as Array<CatalogCategoryRow> | null)
          : null;

      if ((!compData || compData.length === 0) && (!catData || catData.length === 0)) {
        registryStore.setState((s) => ({ ...s, loading: false }));
        return;
      }

      const mergedItems =
        compData && compData.length > 0
          ? mergeWithStatic(compData)
          : registryStore.state.items;
      const mergedCategories =
        catData && catData.length > 0
          ? mergeCategoryStyles(catData)
          : registryStore.state.categories;

      applyCategoryCssVars(mergedCategories);

      const now = Date.now();
      saveCache(mergedItems, mergedCategories, now);

      registryStore.setState(() => ({
        items: mergedItems,
        categories: mergedCategories,
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

export function getCategoryStyles(): Record<string, CategoryStyle> {
  return registryStore.state.categories;
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
    categories: state.categories,
    source: state.source,
    loading: state.loading,
    refresh: () => refreshCatalogFromSupabase(true),
  };
}
