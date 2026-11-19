/**
 * @fileoverview TanStack Start RPC server function powering the SysDesign AI Architect.
 * Uses unified OpenAI-compatible Chat Completions endpoints across OpenAI, Anthropic,
 * and Google Gemini with multi-step tool calling and server-side catalog lookup.
 *
 * NOTE: Intentionally named `ai.rpc.ts` (not `*.server.ts`) so client code can import
 * the `createServerFn` RPC stub without tripping TanStack Start import protection.
 */

import { createServerFn } from "@tanstack/react-start";
import type { AICanvasOperation } from "@/lib/ai.tools";
import type { SerializedCanvasContext } from "@/lib/ai.context";
import type { AIProvider } from "@/store/ai.store";
import type { NodeCategory, NodeTemplate } from "@/types/diagram";

export interface RunAIArchitectInput {
  provider: AIProvider;
  modelId: string;
  apiKey: string;
  canvas: SerializedCanvasContext;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface RunAIArchitectOutput {
  text: string;
  operations: Array<AICanvasOperation>;
  toolSteps: Array<string>;
}

/**
 * Official OpenAI-compatible base URLs for each supported provider.
 */
const OPENAI_COMPAT_BASE_URLS: Record<AIProvider, string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  google: "https://generativelanguage.googleapis.com/v1beta/openai",
  deepseek: "https://api.deepseek.com/v1",
};

let serverCatalogCache: { items: Array<NodeTemplate>; fetchedAt: number } | null =
  null;
const SERVER_CATALOG_TTL_MS = 10 * 60 * 1000;

async function getServerCatalog(): Promise<Array<NodeTemplate>> {
  const { REGISTRY } = await import("@/data/registry");

  if (
    serverCatalogCache &&
    Date.now() - serverCatalogCache.fetchedAt < SERVER_CATALOG_TTL_MS
  ) {
    return serverCatalogCache.items;
  }

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return REGISTRY;

  try {
    const res = await fetch(
      `${url}/rest/v1/catalog_components?select=subtype,label,category,icon,description,default_technology,is_active&is_active=eq.true&order=sort_order.asc`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      },
    );
    if (!res.ok) return REGISTRY;
    const rows = (await res.json()) as Array<{
      subtype: string;
      label: string;
      category: NodeCategory;
      icon: string;
      description?: string;
      default_technology?: string | null;
      is_active?: boolean;
    }>;
    if (!Array.isArray(rows) || rows.length === 0) return REGISTRY;

    const merged = new Map<string, NodeTemplate>();
    for (const item of REGISTRY) merged.set(item.subtype, item);
    for (const row of rows) {
      merged.set(row.subtype, {
        subtype: row.subtype,
        label: row.label,
        category: row.category,
        icon: row.icon || "IconBox",
        description: row.description ?? "",
        technology: row.default_technology ?? undefined,
      });
    }
    const items = Array.from(merged.values());
    serverCatalogCache = { items, fetchedAt: Date.now() };
    return items;
  } catch {
    return REGISTRY;
  }
}

/**
 * Server-side AI Architect runner using unified OpenAI-compatible Chat Completions endpoints.
 */
export const runAIArchitect = createServerFn({ method: "POST" })
  .validator((data: RunAIArchitectInput) => data)
  .handler(async ({ data }): Promise<RunAIArchitectOutput> => {
    const { provider, modelId, apiKey, canvas, messages } = data;

    if (!apiKey || !apiKey.trim()) {
      throw new Error(`Missing API key for ${provider}`);
    }

    // Dynamic imports keep all AI SDK & schema dependencies strictly server-side
    const [
      { generateText, stepCountIs, tool },
      { createOpenAI },
      { buildArchitectSystemPrompt },
      { searchRegistry },
      {
        addElementsInputSchema,
        groupNodesInputSchema,
        lookupComponentsInputSchema,
        removeElementsInputSchema,
        replaceDiagramInputSchema,
        updateElementsInputSchema,
      },
    ] = await Promise.all([
      import("ai"),
      import("@ai-sdk/openai"),
      import("@/lib/ai.prompts"),
      import("@/lib/ai.registry"),
      import("@/lib/ai.tools"),
    ]);

    const operations: Array<AICanvasOperation> = [];
    const toolSteps: Array<string> = [];

    const client = createOpenAI({
      apiKey: apiKey.trim(),
      baseURL: OPENAI_COMPAT_BASE_URLS[provider],
    });
    const model = client.chat(modelId);

    const system = buildArchitectSystemPrompt(canvas);
    const catalogPool = await getServerCatalog();

    const result = await generateText({
      model,
      system,
      messages,
      temperature: 0.3,
      stopWhen: stepCountIs(5),
      tools: {
        lookup_components: tool({
          description:
            "Search the verified SysDesign component registry (AWS, GCP, Azure, databases, security, AI/ML, networking, observability) to find exact subtypes before creating nodes.",
          inputSchema: lookupComponentsInputSchema,
          execute: async ({ query, category }) => {
            const matches = searchRegistry(query, category, 16, catalogPool);
            toolSteps.push(`Looked up "${query}" (${matches.length} matches)`);
            return { matches };
          },
        }),

        replace_diagram: tool({
          description:
            "Generate a complete new architecture or C4 diagram from scratch, replacing the canvas. Layout is automatically computed with Dagre.",
          inputSchema: replaceDiagramInputSchema,
          execute: async (input) => {
            operations.push({ type: "replace_diagram", input });
            toolSteps.push(
              `Designed ${input.nodes.length} nodes & ${input.edges.length} connections`,
            );
            return {
              ok: true,
              nodeCount: input.nodes.length,
              edgeCount: input.edges.length,
            };
          },
        }),

        add_elements: tool({
          description:
            "Incrementally add new nodes and/or connections to the existing canvas without erasing existing elements.",
          inputSchema: addElementsInputSchema,
          execute: async (input) => {
            operations.push({ type: "add_elements", input });
            toolSteps.push(
              `Added ${input.nodes.length} node${input.nodes.length === 1 ? "" : "s"} & ${input.edges.length} connection${input.edges.length === 1 ? "" : "s"}`,
            );
            return {
              ok: true,
              addedNodes: input.nodes.length,
              addedEdges: input.edges.length,
            };
          },
        }),

        update_elements: tool({
          description:
            "Update labels, subtypes, technology stack, status, or descriptions on existing nodes or edge labels.",
          inputSchema: updateElementsInputSchema,
          execute: async (input) => {
            operations.push({ type: "update_elements", input });
            const total = input.nodes.length + input.edges.length;
            toolSteps.push(`Updated ${total} element${total === 1 ? "" : "s"}`);
            return { ok: true, updated: total };
          },
        }),

        remove_elements: tool({
          description:
            "Delete specific node IDs or edge IDs from the current canvas.",
          inputSchema: removeElementsInputSchema,
          execute: async (input) => {
            operations.push({ type: "remove_elements", input });
            toolSteps.push(
              `Removed ${input.nodeIds.length} node${input.nodeIds.length === 1 ? "" : "s"} & ${input.edgeIds.length} edge${input.edgeIds.length === 1 ? "" : "s"}`,
            );
            return { ok: true };
          },
        }),

        group_nodes: tool({
          description:
            "Group 2 or more existing node IDs inside a labeled architectural boundary or VPC.",
          inputSchema: groupNodesInputSchema,
          execute: async (input) => {
            operations.push({ type: "group_nodes", input });
            toolSteps.push(`Grouped "${input.label}"`);
            return { ok: true };
          },
        }),
      },
    });

    const fallbackText =
      operations.length > 0
        ? "Updated the canvas with the requested architecture changes."
        : "I couldn't produce a response for that request. Try rephrasing or being more specific.";

    return {
      text: result.text.trim() || fallbackText,
      operations,
      toolSteps,
    };
  });
